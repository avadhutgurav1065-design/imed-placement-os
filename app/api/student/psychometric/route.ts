import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@/lib/supabase/server";

// Initialize Gemini Client
const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { targetRole, qnaPairs } = await req.json();

    if (!qnaPairs || !targetRole) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Fetch the student's actual profile for name/email
    const { data: profile } = await supabase
      .from("student_profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single();

    // Define the schema for the Psychometric Evaluation
    const responseSchema = {
      type: "object",
      properties: {
        analytical_ability: {
          type: "integer",
          description: "Score from 0 to 100 representing analytical thinking and problem-solving.",
        },
        execution_delivery: {
          type: "integer",
          description: "Score from 0 to 100 representing focus on execution, speed, and delivery.",
        },
        interpersonal_skills: {
          type: "integer",
          description: "Score from 0 to 100 representing communication and emotional intelligence.",
        },
        team_collaboration: {
          type: "integer",
          description: "Score from 0 to 100 representing teamwork and consensus building.",
        },
        leadership_potential: {
          type: "integer",
          description: "Score from 0 to 100 representing assertiveness, vision, and taking charge.",
        },
        stress_tolerance: {
          type: "integer",
          description: "Score from 0 to 100 representing composure and resilience under pressure.",
        },
        adaptability: {
          type: "integer",
          description: "Score from 0 to 100 representing flexibility to change and new technologies.",
        },
        detail_orientation: {
          type: "integer",
          description: "Score from 0 to 100 representing meticulousness and quality focus over speed.",
        },
        summary_report: {
          type: "string",
          description: "A 2-3 paragraph professional psychological summary of the candidate based on Harrison Paradox Theory. Evaluate their literal thought process based on their written responses. Detail their strengths, ideal work environment, and potential blind spots specifically in the context of a " + targetRole + " role.",
        },
      },
      required: [
        "analytical_ability",
        "execution_delivery",
        "interpersonal_skills",
        "team_collaboration",
        "leadership_potential",
        "stress_tolerance",
        "adaptability",
        "detail_orientation",
        "summary_report",
      ],
    };

    // Prompt Gemini for the Evaluation
    const prompt = `
      You are an expert organizational psychologist and corporate recruiter certified in Harrison Assessment and Paradox Theory.
      A student candidate has completed a dynamic situational judgment test for the role of: "${targetRole}".
      
      Unlike standard multiple-choice tests, this candidate provided free-text manual responses explaining EXACTLY what they would do in these situations.
      Analyze their thought process, tone, and literal text to grade them on the 8 core behavioral traits.
      Be extremely analytical. Do not just give everyone high scores. 

      CANDIDATE SITUATIONS & ANSWERS:
      ${JSON.stringify(qnaPairs, null, 2)}
    `;

    const interaction = await client.interactions.create({
      model: "gemini-3.5-flash-lite",
      input: prompt,
      response_format: [
        {
          type: "text",
          mime_type: "application/json",
          schema: responseSchema,
        }
      ],
    });

    const aiText = interaction.output_text;
    if (!aiText) {
      throw new Error("AI returned empty response");
    }

    const evaluation = JSON.parse(aiText);

    // Save to Database
    const { error: dbError } = await supabase
      .from("psychometric_assessments")
      .insert({
        user_id: user.id,
        student_name: profile?.full_name || user.email?.split("@")[0] || "Unknown Student",
        target_role: targetRole,
        raw_answers: qnaPairs,
        analytical_ability: evaluation.analytical_ability,
        execution_delivery: evaluation.execution_delivery,
        interpersonal_skills: evaluation.interpersonal_skills,
        team_collaboration: evaluation.team_collaboration,
        leadership_potential: evaluation.leadership_potential,
        stress_tolerance: evaluation.stress_tolerance,
        adaptability: evaluation.adaptability,
        detail_orientation: evaluation.detail_orientation,
        summary_report: evaluation.summary_report,
      });

    if (dbError) {
      console.error("Database Error:", dbError);
      throw new Error("Failed to save evaluation to database");
    }

    return NextResponse.json({ success: true, evaluation });

  } catch (error) {
    console.error("Psychometric Grading Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error during AI evaluation" },
      { status: 500 }
    );
  }
}
