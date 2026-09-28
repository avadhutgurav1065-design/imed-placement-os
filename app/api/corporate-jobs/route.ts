import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { data: jobs, error } = await supabase
      .from("corporate_jobs")
      .select("id, company_name, role_title, raw_requirements")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ jobs: jobs || [] });
  } catch (error: any) {
    console.error("Corporate Jobs Fetch Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
