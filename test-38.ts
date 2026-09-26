import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  try {
    const interaction = await client.interactions.create({
      model: "gemini-3.8-flash",
      input: "Hello",
    });
    console.log("Success 3.8-flash:", interaction.output_text);
  } catch (e) {
    console.error("Error 3.8-flash:", e);
  }
}
run();
