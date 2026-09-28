import { NextResponse, after } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateGeminiContent } from '@/lib/ai/gemini';

export async function POST(req: Request) {
  try {
    const { fileName, jobRole, jobDescription } = await req.json();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Create a pending job record in DB
    const { data: jobRecord, error: insertError } = await supabase
      .from('gap_analyses')
      .insert({
         user_id: user.id,
         target_role: jobRole || "General Submission",
         student_name: 'Analyzing...', // Temporary placeholder
         status: 'pending'
      })
      .select('id, job_id')
      .single();

    if (insertError || !jobRecord) {
      throw new Error("Failed to initialize background job");
    }

    // 2. Start background task using Next.js unstable_after
    after(async () => {
      try {
        // We need a server-role client to run tasks without relying on cookie sessions that might expire or are not available in after()
        const adminSupabase = await createClient(); 

        const { data, error } = await adminSupabase.storage.from('resumes').download(fileName);
        if (error) throw new Error('Failed to download PDF from storage');

        const arrayBuffer = await data.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Data = buffer.toString('base64');

        const pdfPart = {
          inlineData: {
            data: base64Data,
            mimeType: 'application/pdf',
          },
        };

        const prompt = `
          You are an expert enterprise ATS scanner. Analyze the attached candidate's resume strictly against this specific job description for the role of: ${jobRole}. 
          "Extract the candidate's full name from the resume and return it under the JSON key: candidateName."
          OFFICIAL JOB DESCRIPTION:
          ${jobDescription}
          
          Return ONLY a raw JSON object (no markdown, no backticks, no code blocks) with exactly this structure:
          {
            "candidateName": "string (extracted from resume)",
            "matchScore": number (0 to 100),
            "missingSkills": ["Skill 1", "Skill 2"],
            "actionPlan": ["Action 1", "Action 2"]
          }
        `;

        const result = await generateGeminiContent([prompt, pdfPart]);
        if (!result) throw new Error("AI Engine failed to respond after multiple attempts.");
        
        const rawResponse = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        const analysis = JSON.parse(rawResponse);

        // Update the record with actual analysis results
        await adminSupabase
          .from('gap_analyses')
          .update({
             student_name: analysis.candidateName || 'Unknown Student',
             match_score: analysis.matchScore || 0,
             missing_skills: analysis.missingSkills || [],
             action_plan: analysis.actionPlan || [],
             status: 'completed'
          })
          .eq('id', jobRecord.id);
          
      } catch (backgroundError) {
        console.error("Background AI Task Failed:", backgroundError);
        const adminSupabase = await createClient(); 
        await adminSupabase
          .from('gap_analyses')
          .update({ status: 'failed' })
          .eq('id', jobRecord.id);
      }
    });

    // 3. Return 202 Accepted immediately
    return NextResponse.json({ 
      message: "Analysis started", 
      jobId: jobRecord.job_id,
      recordId: jobRecord.id
    }, { status: 202 });

  } catch (error: any) {
    console.error("Analysis API Initialization Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}