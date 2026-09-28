import { GoogleGenerativeAI, GenerateContentResult } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function generateGeminiContent(
  promptOrParts: string | Array<string | any>, 
  modelName: string = "gemini-3.5-flash-lite", 
  maxRetries: number = 3
): Promise<GenerateContentResult> {
  const model = genAI.getGenerativeModel({ model: modelName });
  return withGeminiBackoff(() => model.generateContent(promptOrParts), maxRetries);
}

export async function withGeminiBackoff<T>(
  action: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let attempt = 0;
  let delay = 2000; // start with 2 seconds

  while (attempt <= maxRetries) {
    try {
      const result = await action();
      return result;
    } catch (error: any) {
      attempt++;
      console.error(`Gemini API Error (Attempt ${attempt}):`, error.message);
      
      // If we've reached max retries, throw the error
      if (attempt > maxRetries) {
        throw new Error(`Gemini API Failed after ${maxRetries} retries. Last error: ${error.message}`);
      }
      
      // Check if it's a rate limit or service unavailable error (429 or 503)
      if (error.status === 429 || error.status === 503 || error.message?.includes('429') || error.message?.includes('503')) {
        console.log(`Waiting ${delay}ms before retrying...`);
        await new Promise(res => setTimeout(res, delay));
        delay *= 2; // exponential backoff
      } else {
        // For other types of errors (e.g. 400 Bad Request, unauthorized), throw immediately
        throw error;
      }
    }
  }
  throw new Error("Unexpected error in withGeminiBackoff");
}
