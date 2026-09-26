import { NextResponse } from "next/server";
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MODEL_NAME = "gemini-3.5-flash-lite";

const responseSchema: Schema = {
  type: Type.ARRAY,
  description: "List of 25 multiple choice questions.",
  items: {
    type: Type.OBJECT,
    properties: {
      question: { type: Type.STRING, description: "The question text." },
      options: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Exactly 4 multiple choice options.",
      },
      correctAnswer: { type: Type.STRING, description: "The correct option text exactly matching one of the options." },
      explanation: { type: Type.STRING, description: "Brief explanation of why the answer is correct." },
      difficulty: { type: Type.STRING, enum: ["easy", "medium", "hard"], description: "The difficulty level of the question." }
    },
    required: ["question", "options", "correctAnswer", "explanation", "difficulty"],
  },
};

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobRole, assessmentType } = await req.json();

    if (!jobRole || !assessmentType) {
      return NextResponse.json({ error: "jobRole and assessmentType are required" }, { status: 400 });
    }

    if (assessmentType !== "aptitude" && assessmentType !== "technical") {
      return NextResponse.json({ error: "assessmentType must be 'aptitude' or 'technical'" }, { status: 400 });
    }

    const systemInstruction = 
      assessmentType === "aptitude"
      ? `You are an expert recruitment assessor creating an Aptitude Test for a candidate applying for the role of ${jobRole}. 
         The test must contain EXACTLY 25 multiple-choice questions assessing their quantitative aptitude, logical reasoning, verbal reasoning, and data interpretation skills in the context of their target role. 
         Provide exactly 8 'easy', 9 'medium', and 8 'hard' questions.`
      : `You are an expert technical interviewer creating a Technical Skills Test for a candidate applying for the role of ${jobRole}. 
         The test must contain EXACTLY 25 multiple-choice questions assessing their domain knowledge, technical stack proficiency, problem-solving, and theoretical understanding required for a ${jobRole}. 
         You may include 'guess the output' or 'find the bug' style questions using small code snippets or scenario descriptions. 
         Provide exactly 8 'easy', 9 'medium', and 8 'hard' questions.`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        {
          role: "user",
          parts: [{ text: "Generate the 25-question MCQ test now." }],
        },
      ],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.7,
      },
    });

    const resultText = response.text;
    
    if (!resultText) {
      throw new Error("Failed to generate assessment.");
    }

    const questions = JSON.parse(resultText);

    return NextResponse.json({ questions });
  } catch (error: any) {
    console.error("Assessment Generation Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate assessment" },
      { status: 500 }
    );
  }
}
