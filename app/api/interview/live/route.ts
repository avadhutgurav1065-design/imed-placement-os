import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { withGeminiBackoff } from "@/lib/ai/gemini";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { targetRole, history, studentAnswer, mode, images, lowBandwidthMode } = body;

    // Phase 2: Resume Integration - Fetch student skills
    const { data: profile } = await supabase
      .from("student_profiles")
      .select("skills")
      .eq("id", user.id)
      .single();

    const studentSkills = profile?.skills ? (Array.isArray(profile.skills) ? profile.skills.join(", ") : "Not specified") : "Not specified";

    const totalExchanges = Math.floor((history?.length || 0) / 2) + 1;

    let systemInstruction = `You are a highly experienced, STRICT, and observant Corporate Recruiter and Technical Interviewer for the role of ${targetRole}.
You are conducting a LIVE ${lowBandwidthMode ? 'audio/text' : 'audio-visual'} interview.

**CANDIDATE CONTEXT:**
The candidate claims to have the following skills on their resume/profile: ${studentSkills}. 
You must explicitly test their knowledge on these specific skills if they are relevant to the role.

**ADAPTIVE QUESTION BRANCHING (PHASE 2 UPGRADE):**
1. You must dynamically adjust the difficulty of your next question based on how they answered the previous one.
2. If they answer perfectly, the next question MUST be significantly harder or a complex scenario.
3. If they struggle, the next question MUST drop back to fundamentals to gauge their exact baseline.

**HOLISTIC EVALUATION (3 DIMENSIONS):**
1. Technical Brilliance & Skill Validation: Are they actually proficient in what they claim?
2. Soft Skills & Vocal Delivery: Are they speaking clearly? Are they confident?
3. ${lowBandwidthMode ? 'Contextual' : 'Visual'} Proctoring: ${lowBandwidthMode ? 'The candidate is on a low-bandwidth connection. You will not receive images. Do not complain about missing video. Focus solely on their answers and text behavior.' : 'You receive webcam snapshots. Are they reading off a screen? Looking away? Is there a second person in the frame?'}

${!lowBandwidthMode ? `CRITICAL PROCTORING RULE: YOU MUST ANALYZE THE IMAGE. If you detect ANY signs of:
- A second person in the frame.
- The candidate reading off a screen or holding a phone.
- The candidate looking away constantly.
YOU MUST GIVE A STRICT VERBAL WARNING IMMEDIATELY before asking the next question.` : ''}

Be conversational but strict. Reply strictly with:
- Brief adaptive feedback on their previous answer.
${!lowBandwidthMode ? '- IF cheating is detected, a strict verbal warning.' : ''}
- Your next interview question (adapted in difficulty).

Keep your responses concise so they sound natural when spoken out loud. Ask only 1 question at a time.`;

    if (totalExchanges >= 5) {
      systemInstruction += `\n\nCRITICAL INSTRUCTION: This is the final exchange. You must conclude the interview now. DO NOT ask another question. 
You must provide your final evaluation strictly using these tags at the very end of your response:
[BEHAVIOR: ${lowBandwidthMode ? 'Provide a strict, 1-2 sentence analysis of their answers and communication style, noting that visual proctoring was disabled due to low bandwidth.' : 'Provide a strict, 1-2 sentence analysis of their visual behavior (eye contact, confidence, reading off screen, second person in frame) based on all images provided.'}]
[RESUME_FEEDBACK: Did they successfully answer questions related to the skills on their resume? Mention specific missing skills if any.]
[TIMELINE: Provide a brief timestamped timeline of key moments, e.g., 'Q1 - Candidate struggled with basics | Q3 - Candidate showed strong problem solving']
[ACTION_PLAN: Provide a strict 5-point Action Plan for further upskilling.]
[SCORE_COMMUNICATION: 85] (Out of 100)
[SCORE_TECHNICAL: 90] (Out of 100)
[SCORE_PROBLEM_SOLVING: 80] (Out of 100)
[SCORE_CULTURE_FIT: 85] (Out of 100)
[SCORE: 85] (Overall out of 100)
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

    let aiResponse = "";
    try {
      const result = await withGeminiBackoff(() => chat.sendMessage(parts));
      aiResponse = result.response.text().trim();
    } catch (apiError) {
      console.warn("AI Engine failed, using static fallback for interview continuation:", apiError);
      
      if (totalExchanges >= 5) {
         aiResponse = `[SCORE_COMMUNICATION: 75]\n[SCORE_TECHNICAL: 75]\n[SCORE_PROBLEM_SOLVING: 75]\n[SCORE_CULTURE_FIT: 75]\n[SCORE: 75]\n[BEHAVIOR: AI connection lost, fallback used.]\n[RESUME_FEEDBACK: N/A]\n[ACTION_PLAN: Connection dropped, partial evaluation only.]\nThank you for your time. This concludes our interview.`;
      } else {
         const fallbacks = [
           "Can you explain a complex project you've worked on recently?",
           "How do you handle disagreements with team members?",
           "What is your approach to debugging difficult technical issues?",
           "Where do you see your career heading in the next few years?"
         ];
         aiResponse = fallbacks[(totalExchanges - 1) % fallbacks.length];
      }
    }

    // Check if the AI ended the interview and gave a score
    const scoreMatch = aiResponse.match(/\[SCORE:\s*(\d+)\]/i);
    let isComplete = false;

    if (scoreMatch) {
      isComplete = true;
      const score = parseInt(scoreMatch[1]);
      
      const actionPlanMatch = aiResponse.match(/\[ACTION_PLAN:\s*([\s\S]*?)\]/i);
      const behaviorMatch = aiResponse.match(/\[BEHAVIOR:\s*([\s\S]*?)\]/i);
      const resumeFeedbackMatch = aiResponse.match(/\[RESUME_FEEDBACK:\s*([\s\S]*?)\]/i);
      const timelineMatch = aiResponse.match(/\[TIMELINE:\s*([\s\S]*?)\]/i);
      const scoreCommMatch = aiResponse.match(/\[SCORE_COMMUNICATION:\s*(\d+)\]/i);
      const scoreTechMatch = aiResponse.match(/\[SCORE_TECHNICAL:\s*(\d+)\]/i);
      const scoreProbMatch = aiResponse.match(/\[SCORE_PROBLEM_SOLVING:\s*(\d+)\]/i);
      const scoreCultureMatch = aiResponse.match(/\[SCORE_CULTURE_FIT:\s*(\d+)\]/i);
      
      // Save to interview_logs so it shows up in history
      await supabase.from("interview_logs").insert({
        student_id: user.id,
        target_role: targetRole,
        overall_score: score,
        ai_feedback: {
          feedback: aiResponse,
          action_plan: actionPlanMatch ? actionPlanMatch[1].trim() : (aiResponse.split("Action Plan").pop() || "Keep practicing."),
          student_behavior: behaviorMatch ? behaviorMatch[1].trim() : "Analyzed via Live Webcam feed during the interview.",
          resume_feedback: resumeFeedbackMatch ? resumeFeedbackMatch[1].trim() : "No specific resume discrepancies noted.",
          timeline: timelineMatch ? timelineMatch[1].trim() : "Timeline not provided.",
          scores: {
            communication: scoreCommMatch ? parseInt(scoreCommMatch[1]) : score,
            technical: scoreTechMatch ? parseInt(scoreTechMatch[1]) : score,
            problem_solving: scoreProbMatch ? parseInt(scoreProbMatch[1]) : score,
            culture_fit: scoreCultureMatch ? parseInt(scoreCultureMatch[1]) : score,
          }
        },
        questions: history?.filter((m: any) => m.role === "ai") || [],
        answers: history?.filter((m: any) => m.role === "user") || [],
        created_at: new Date().toISOString()
      });
    }

    return NextResponse.json({ response: aiResponse, isComplete });
  } catch (error: any) {
    console.error("Live Interview API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
