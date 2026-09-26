import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function run() {
  try {
    const responseSchema = {
      type: "object",
      properties: {
        situations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              scenario: { type: "string" }
            },
            required: ["id", "scenario"]
          }
        }
      },
      required: ["situations"]
    };

    const prompt = `Generate exactly 1 specific, challenging Situational Judgment scenario`;

    const interaction = await client.interactions.create({
      model: "gemini-3.6-flash",
      input: prompt,
      response_format: [
        {
          type: "text",
          mime_type: "application/json",
          schema: responseSchema,
        }
      ],
    });
    console.log("Success:", interaction.output_text);
  } catch (error) {
    console.error("Error details:");
    console.dir(error, { depth: null });
  }
}

run();
