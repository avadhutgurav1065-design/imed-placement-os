import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function testModel(modelName: string) {
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent("Hello, respond with OK");
    console.log(`Success ${modelName}:`, result.response.text());
  } catch (e: any) {
    console.error(`Error ${modelName}:`, e.message);
  }
}

async function run() {
  await testModel("gemini-3.8-flash");
  await testModel("gemini-3.5-flash-lite");
  await testModel("gemini-1.5-flash");
  await testModel("gemini-1.5-pro");
  process.exit(0);
}
run();
