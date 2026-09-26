import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function run() {
  try {
    const prompt = `Hello`;
    const interaction = await client.interactions.create({
      model: "gemini-3.6-flash",
      input: prompt
    });
    console.log("Success:", interaction.output_text);
  } catch (error) {
    console.error("Error:", error);
  }
}

run();
