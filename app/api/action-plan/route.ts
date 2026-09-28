import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET action plan items for a specific gap_analysis or for the current user
export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const analysisId = url.searchParams.get("analysis_id");

    let query = supabase.from("action_plan_progress").select("*, gap_analyses!inner(user_id)");

    if (analysisId) {
      query = query.eq("analysis_id", analysisId);
    }
    
    // Always restrict to the logged in user unless they are an admin.
    // The RLS already handles this, but explicitly doing it in the query is safer.
    query = query.eq("gap_analyses.user_id", user.id);

    const { data, error } = await query.order("created_at", { ascending: true });
    
    if (error) throw error;

    return NextResponse.json({ items: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// UPDATE action plan item completion status
export async function PATCH(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, is_completed } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Missing item id" }, { status: 400 });
    }

    // RLS handles auth validation: "Students update own action plans"
    const { data, error } = await supabase
      .from("action_plan_progress")
      .update({
        is_completed,
      })
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({ item: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
