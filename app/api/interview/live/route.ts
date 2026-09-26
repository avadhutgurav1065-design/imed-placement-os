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

    const totalExchanges = Math.floor((history?.length || 0) / 2) + 1;

    let systemInstruction = `You are a highly experienced, STRICT, and observant Corporate Recruiter and Technical Interviewer for the role of ${targetRole}.
You are conducting a LIVE audio-visual interview.

You must analyze the candidate holistically on THREE dimensions:
1. Technical Brilliance: Is their answer technically correct, well-structured, and relevant to the role?
2. Soft Skills & Vocal Delivery: Are they speaking clearly? Are they using too many filler words (um, uh)? Are they confident in their tone?
3. Proctoring & Visual Confidence: You receive webcam snapshots. 
   - Analyze their eyes and face. Are they reading off a screen? Are they looking away?
   - Is someone else in the frame?
   - If you detect any signs of reading, looking away constantly, or cheating, you MUST GIVE A STRICT WARNING immediately before asking the next question.

Be conversational but strict. Do not list out numeric scores during the interview. Reply strictly with:
- Brief feedback on their previous answer (evaluating both their technical correctness AND their soft skills/visual confidence based on the images).
- Your next interview question.

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
      
      // Save to student_assessments so it shows up in Test Results and Dashboard
      await supabase.from("student_assessments").insert({
        student_id: user.id,
        assessment_type: "Multimodal Live Interview",
        module_name: targetRole + " Live Interview",
        score: score,
        status: "completed",
        feedback: aiResponse,
        created_at: new Date().toISOString()
      });
    }

    return NextResponse.json({ response: aiResponse, isComplete });
  } catch (error: any) {
    console.error("Live Interview API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
