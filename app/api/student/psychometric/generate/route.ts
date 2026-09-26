import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const { targetRole } = await req.json();

    if (!targetRole) {
      return NextResponse.json({ error: "Missing target role" }, { status: 400 });
    }

    const responseSchema = {
      type: "object",
      properties: {
        situations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              scenario: { type: "string", description: "The professional situation the candidate must react to." }
            },
            required: ["id", "scenario"]
          }
        }
      },
      required: ["situations"]
    };

    const prompt = `
      You are an expert organizational psychologist designing a Harrison Assessment test.
      The candidate is applying for the role of: "${targetRole}".

      Generate exactly 7 highly specific, challenging Situational Judgment scenarios that this specific role would face in the real world.
      Do not provide multiple choice options. The student will write a free-text response explaining exactly what they would do.
      
      Make the situations test different aspects of their psychology:
      1. A high-pressure deadline or execution failure.
      2. A conflict with a teammate or manager.
      3. A vague instruction requiring autonomy.
      4. A detail-oriented quality assurance issue.
      5. Adapting to a sudden change in requirements or technology.
      6. A leadership or decision-making crisis.
      7. A client or stakeholder negotiation.
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
    if (!aiText) throw new Error("AI returned empty response");

    const data = JSON.parse(aiText);
    return NextResponse.json({ success: true, situations: data.situations });

  } catch (error) {
    console.error("Test Generation Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error during test generation" },
      { status: 500 }
    );
  }
}
