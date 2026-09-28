import { NextResponse } from "next/server";
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { createClient } from "@/lib/supabase/server";
import { withGeminiBackoff } from "@/lib/ai/gemini";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL_NAME = "gemini-3.5-flash-lite";

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    overallScore: { type: Type.INTEGER, description: "Total score out of 100 for all 3 challenges combined." },
    feedback: { 
      type: Type.ARRAY,
      description: "Detailed feedback for each challenge.",
      items: {
        type: Type.OBJECT,
        properties: {
          challengeTitle: { type: Type.STRING },
          score: { type: Type.INTEGER, description: "Score out of 33 (or 34) for this specific challenge." },
          comments: { type: Type.STRING, description: "Constructive feedback on what was good and what could be improved." }
        },
        required: ["challengeTitle", "score", "comments"]
      }
    },
    generalAdvice: { type: Type.STRING, description: "One paragraph of overall advice for the candidate." }
  },
  required: ["overallScore", "feedback", "generalAdvice"]
};

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobRole, challenges, responses } = await req.json();

    if (!jobRole || !challenges || !responses) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const systemInstruction = `You are an expert Evaluator grading a ${jobRole} candidate's technical skills test. 
    You will receive the 3 challenges and the candidate's answers.
    Evaluate the answers based on logic, correctness, efficiency, and depth of understanding.
    Be objective. Provide a score out of 100 overall, and breakdown the feedback per challenge.
    Use the required JSON format.`;

    const promptText = `
    Job Role: ${jobRole}

    Challenges and Responses:
    ${challenges.map((c: any, index: number) => `
    Challenge ${index + 1}: ${c.title}
    Type: ${c.type}
    Description: ${c.description}
    Expected Output/Goal: ${c.expectedOutput}
    ---
    Candidate's Response:
    ${responses[index] || "No response provided."}
    `).join('\n\n')}
    `;

    const response = await withGeminiBackoff(() => ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        {
          role: "user",
          parts: [{ text: promptText }],
        },
      ],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.3, 
      },
    }));

    const resultText = response.text;
    
    if (!resultText) {
      throw new Error("Failed to evaluate assessment.");
    }

    const data = JSON.parse(resultText);

    // Save to DB
    const { error: dbError } = await supabase
      .from("interview_logs")
      .insert({
        student_id: session.user.id,
        target_role: jobRole,
        overall_score: data.overallScore,
        questions: challenges,
        answers: responses,
        ai_feedback: {
          feedback: data.feedback,
          generalAdvice: data.generalAdvice,
          assessment_type: "technical"
        }
      });

    if (dbError) {
      console.error("Failed to save technical assessment:", dbError);
    }

    return NextResponse.json({ evaluation: data });
  } catch (error: any) {
    console.error("Technical Assessment Evaluation Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to evaluate assessment" },
      { status: 500 }
    );
  }
}
