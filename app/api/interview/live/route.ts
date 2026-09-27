import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const supabaseUser = await createServerClient();
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { targetRole, history, studentAnswer, mode, images } = body;

    // Phase 2: Resume Integration - Fetch student skills
    const { data: profile } = await supabase
      .from("student_profiles")
      .select("skills")
      .eq("id", user.id)
      .single();

    const studentSkills = profile?.skills ? (Array.isArray(profile.skills) ? profile.skills.join(", ") : "Not specified") : "Not specified";

    const totalExchanges = Math.floor((history?.length || 0) / 2) + 1;

    let systemInstruction = `You are a highly experienced, STRICT, and observant Corporate Recruiter and Technical Interviewer for the role of ${targetRole}.
You are conducting a LIVE audio-visual interview.

**CANDIDATE CONTEXT:**
The candidate claims to have the following skills on their resume/profile: ${studentSkills}. 
You must explicitly test their knowledge on these specific skills if they are relevant to the role.

**ADAPTIVE QUESTION BRANCHING (PHASE 2 UPGRADE):**
1. You must dynamically adjust the difficulty of your next question based on how they answered the previous one.
2. If they answer perfectly, the next question MUST be significantly harder or a complex scenario.
3. If they struggle, the next question MUST drop back to fundamentals to gauge their exact baseline.

**HOLISTIC EVALUATION (3 DIMENSIONS):**
1. Technical Brilliance & Skill Validation: Are they actually proficient in what they claim?
2. Soft Skills & Vocal Delivery: Are they speaking clearly? Are they confident?
3. Visual Proctoring: You receive webcam snapshots. Are they reading off a screen? Looking away?

CRITICAL PROCTORING RULE: If you detect any signs of reading, looking away constantly, or cheating in the images, you MUST GIVE A STRICT VERBAL WARNING immediately before asking the next question.

Be conversational but strict. Reply strictly with:
- Brief adaptive feedback on their previous answer (evaluating their correctness AND their soft skills/visual confidence).
- Your next interview question (adapted in difficulty).

Keep your responses concise so they sound natural when spoken out loud. Ask only 1 question at a time.`;

    if (totalExchanges >= 5) {
      systemInstruction += `\n\nCRITICAL INSTRUCTION: This is the final exchange. You must conclude the interview now. DO NOT ask another question. 
You must provide:
1. A comprehensive summary of their performance across all questions (Technical, Soft Skills, and Visual Confidence).
2. A strict 5-point Action Plan for further upskilling.
3. A final score out of 100 wrapped exactly like this: [SCORE: 85]
End the interview politely.`;
    } else {
      systemInstruction += `\n\nCRITICAL INSTRUCTION: We are at question ${totalExchanges} out of 5. You must ask another interview question based on the role.`;
    }

    let chatHistory = (history || []).map((msg: any) => ({
      role: msg.role === "ai" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    // Fix Gemini history error: history must start with a user message
    if (chatHistory.length > 0 && chatHistory[0].role === "model") {
      chatHistory.unshift({
        role: "user",
        parts: [{ text: "Hello, I am ready for the interview." }]
      });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash-lite",
      systemInstruction,
    });

    const chat = model.startChat({ history: chatHistory });

    const parts: any[] = [];
    
    if (mode === "start") {
      parts.push({ text: "Hello, I am ready to begin the interview. Please introduce yourself and ask your first question." });
    } else {
      parts.push({ text: studentAnswer || "(User provided no verbal answer)" });
      
      // Attach images to the current turn
      if (images && images.length > 0) {
        for (const b64 of images) {
          const base64Data = b64.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");
          parts.push({
            inlineData: {
              data: base64Data,
              mimeType: "image/jpeg"
            }
          });
        }
      }
    }

    const result = await chat.sendMessage(parts);
    const aiResponse = result.response.text().trim();

    // Check if the AI ended the interview and gave a score
    const scoreMatch = aiResponse.match(/\[SCORE:\s*(\d+)\]/i);
    let isComplete = false;

    if (scoreMatch) {
      isComplete = true;
      const score = parseInt(scoreMatch[1]);
      
      // Save to interview_logs so it shows up in history
      await supabase.from("interview_logs").insert({
        student_id: user.id,
        target_role: targetRole,
        overall_score: score,
        ai_feedback: {
          feedback: aiResponse,
          action_plan: aiResponse.split("Action Plan").pop() || "Keep practicing.",
          student_behavior: "Analyzed via Live Webcam feed during the interview.",
        },
        questions: history?.filter((m: any) => m.role === "ai") || [],
        answers: history?.filter((m: any) => m.role === "user") || [],
        created_at: new Date().toISOString()
      });
    }

    return NextResponse.json({ response: aiResponse, isComplete });
  } catch (error: any) {
    console.error("Live Interview API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
