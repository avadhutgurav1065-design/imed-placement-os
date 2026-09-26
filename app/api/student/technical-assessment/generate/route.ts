import { NextResponse } from "next/server";
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { createClient } from "@/lib/supabase/server";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL_NAME = "gemini-3.5-flash-lite";

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    challenges: {
      type: Type.ARRAY,
      description: "List of exactly 3 practical challenges.",
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Title of the challenge" },
          type: { type: Type.STRING, enum: ["coding", "debugging", "design", "case_study", "data_analysis", "communication"], description: "Type of challenge" },
          description: { type: Type.STRING, description: "Detailed problem statement or scenario in Markdown" },
          initialCode: { type: Type.STRING, description: "Initial code provided to the user, if applicable. Can be empty string." },
          expectedOutput: { type: Type.STRING, description: "What the ideal solution should achieve or output" }
        },
        required: ["title", "type", "description", "initialCode", "expectedOutput"]
      }
    }
  },
  required: ["challenges"]
};

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobRole } = await req.json();

    if (!jobRole) {
      return NextResponse.json({ error: "Job role is required" }, { status: 400 });
    }

    const itRoles = ["developer", "engineer", "programmer", "coder", "data scientist", "machine learning", "devops", "full stack", "frontend", "backend", "software"];
    const isITRole = itRoles.some(role => jobRole.toLowerCase().includes(role));

    let systemInstruction = "";

    if (isITRole) {
      systemInstruction = `You are an expert Technical Interviewer assessing a candidate for a ${jobRole} role.
      Generate exactly 3 practical challenges:
      1. A Coding Challenge (algo, logic, or framework specific task).
      2. A Code Review/Debugging task (provide broken/inefficient 'initialCode' for them to fix).
      3. A System Design or Architecture scenario.
      Output exactly these 3 in the specified JSON schema format. Use clear markdown in descriptions.`;
    } else {
      systemInstruction = `You are an expert Hiring Manager assessing a candidate for a ${jobRole} role.
      Generate exactly 3 practical challenges:
      1. A Strategic Case Study (business problem to solve).
      2. A Data Analysis or Logical scenario (describe a scenario with numbers/trends to interpret).
      3. A Professional Communication task (e.g., drafting a sensitive email or memo).
      Output exactly these 3 in the specified JSON schema format. Use clear markdown in descriptions.`;
    }

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        {
          role: "user",
          parts: [{ text: `Generate the 3-part technical skills assessment for the ${jobRole} role.` }],
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

    const data = JSON.parse(resultText);

    return NextResponse.json({ challenges: data.challenges });
  } catch (error: any) {
    console.error("Technical Assessment Generation Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate assessment" },
      { status: 500 }
    );
  }
}
