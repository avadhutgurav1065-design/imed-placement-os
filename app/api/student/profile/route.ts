import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET profile for a user
export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("student_profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile:", error);
      return NextResponse.json({ profile: null });
    }

    return NextResponse.json({ profile: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// CREATE or UPDATE profile
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { full_name, enrollment_no, branch, batch_year, cgpa, email, role } = body;

    const { data, error } = await supabase
      .from("student_profiles")
      .upsert(
        {
          id: user.id,
          full_name,
          enrollment_no,
          branch,
          batch_year,
          cgpa,
          email: email || user.email,
          role: role || "student",
        },
        { onConflict: "id" }
      )
      .select()
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({ profile: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
