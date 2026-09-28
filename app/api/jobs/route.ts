import { NextResponse } from 'next/server';
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: adminProfile } = await supabase
      .from("admin_profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (!adminProfile) {
      return NextResponse.json({ error: "Forbidden - Admins only" }, { status: 403 });
    }

    const { companyName, roleTitle, rawRequirements } = await req.json();

    if (!companyName || !roleTitle || !rawRequirements) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Save the raw text to Supabase (Note: Embeddings removed because vector extension not enabled)
    const { error: dbError } = await supabase
      .from('corporate_jobs')
      .insert({
        company_name: companyName,
        role_title: roleTitle,
        raw_requirements: rawRequirements,
      });

    if (dbError) throw dbError;

    return NextResponse.json({ success: true, message: "Job ingested successfully" });

  } catch (error: any) {
    console.error("Job API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}