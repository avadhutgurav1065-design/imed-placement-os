import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobRole, assessmentType, score, totalQuestions, difficultyBreakdown } = await req.json();

    if (!jobRole || !assessmentType || score === undefined || !totalQuestions) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("interview_logs")
      .insert({
        student_id: session.user.id,
        target_role: jobRole,
        overall_score: score,
        ai_feedback: {
          assessment_type: assessmentType,
          total_questions: totalQuestions,
          difficulty_breakdown: difficultyBreakdown,
        },
      })
      .select()
      .single();

    if (error) {
      console.error("Database Insert Error:", error);
      throw error;
    }

    return NextResponse.json({ success: true, assessment: data });
  } catch (error: any) {
    console.error("Assessment Submit Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit assessment" },
      { status: 500 }
    );
  }
}
