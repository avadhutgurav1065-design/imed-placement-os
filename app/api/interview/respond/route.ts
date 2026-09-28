import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateGeminiContent } from '@/lib/ai/gemini';
import { createClient } from "@/lib/supabase/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { question, studentAnswer, targetRole } = await req.json();
    
    if (!studentAnswer || studentAnswer.trim() === '') {
      return NextResponse.json({ error: "No voice input detected." }, { status: 400 });
    }

    const evaluationPrompt = `
      You are an expert technical interviewer conducting a live screening for the role of "${targetRole}".
      
      TECHNICAL QUESTION ASKED:
      "${question}"
      
      CANDIDATE SPOKEN RESPONSE:
      "${studentAnswer}"
      
      Task:
      1. Evaluate if the candidate's answer is technically accurate.
      2. If correct, acknowledge briefly and ask ONE logical follow-up question.
      3. If incorrect or missing key concepts, point out the exact flaw in 2 sentences, then give them a clue to correct themselves.
      
      Keep the entire response under 4 sentences so it can be spoken quickly via voice text-to-speech. Do not use markdown syntax or code blocks.
    `;

    let feedback = "";
    
    try {
      const result = await generateGeminiContent(evaluationPrompt);
      feedback = result.response.text().trim();
    } catch (e) {
      console.error("Gemini fallback failed", e);
      throw e;
    }

    // --- SECURE LOGGING TO SUPABASE ---
    const { error: dbError } = await supabase
      .from('interview_logs')
      .insert({
        student_id: user.id,
        target_role: targetRole,
        questions: [{ role: "ai", content: question }],
        answers: [{ role: "user", content: studentAnswer }],
        ai_feedback: { feedback }
      });

    if (dbError) {
      console.error("Database Logging Error:", dbError);
    }

    return NextResponse.json({ feedback });

  } catch (error: any) {
    console.error("Voice Response Evaluation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}