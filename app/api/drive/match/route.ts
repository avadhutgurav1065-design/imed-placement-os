import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { withGeminiBackoff, generateGeminiContent } from '@/lib/ai/gemini';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { token, jdText } = await req.json();

    if (!token || !jdText) {
      return NextResponse.json({ error: "Missing token or JD" }, { status: 400 });
    }

    // 1. Verify token
    const { data: driveLink, error: linkErr } = await supabase
      .from('corporate_drive_links')
      .select('company_name, status')
      .eq('magic_token', token)
      .single();

    if (linkErr || !driveLink || driveLink.status !== 'Active') {
      return NextResponse.json({ error: "Invalid or expired link" }, { status: 403 });
    }

    // 2. Fetch all student gap analyses and their basic info
    const { data: students, error: studentsErr } = await supabase
      .from('gap_analyses')
      .select('user_id, student_name, target_role, missing_skills, action_plan');
      
    if (studentsErr || !students || students.length === 0) {
      return NextResponse.json({ error: "No students available to match" }, { status: 404 });
    }

    // 3. Ask Gemini to find top matches
    const systemPrompt = `
      You are an elite technical recruiter for ${driveLink.company_name}.
      You have a target Job Description:
      "${jdText}"

      Here is a list of students and their current AI gap analysis (target role and missing skills):
      ${students.map(s => `ID: ${s.user_id}, Name: ${s.student_name}, Target Role: ${s.target_role}, Weaknesses: ${s.missing_skills}`).join('\n')}

      Evaluate all students against the Job Description. 
      Return a JSON array of the top 5 best matched students for this specific JD.
      Format EXACTLY as this JSON array:
      [
        {
          "id": "user_id_here",
          "name": "Student Name",
          "score": 92,
          "branch": "Extracted or inferred branch/role",
          "skills": ["Matched Skill 1", "Matched Skill 2", "Matched Skill 3"]
        }
      ]
      DO NOT include markdown formatting like \`\`\`json. Return ONLY the raw JSON array.
    `;

    // Process matching with AI backoff resilience
    const matchFunction = async () => {
      const result = await generateGeminiContent(systemPrompt);
      let rawText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(rawText);
    };

    let matchedStudents = [];
    try {
      matchedStudents = await withGeminiBackoff(matchFunction);
    } catch (e) {
      console.error("Gemini Matching Error:", e);
      return NextResponse.json({ error: "AI matching failed due to high load." }, { status: 503 });
    }

    return NextResponse.json({ 
      success: true, 
      companyName: driveLink.company_name,
      matches: matchedStudents 
    });

  } catch (error: any) {
    console.error("Corporate Drive Match Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
