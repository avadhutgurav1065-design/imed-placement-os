import { NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from "@/lib/supabase/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; 
const supabaseService = createServiceClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
  try {
    const supabaseUser = await createServerClient();
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Check if user is admin
    const { data: adminProfile } = await supabaseService
      .from("admin_profiles")
      .select("id")
      .eq("id", user.id)
      .single();
      
    if (!adminProfile && user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: "Forbidden - Admins only" }, { status: 403 });
    }

    const { alumniData } = await req.json();

    if (!alumniData || !Array.isArray(alumniData) || alumniData.length === 0) {
      return NextResponse.json({ error: "No valid alumni data provided." }, { status: 400 });
    }

    // Process and validate rows (ensure email exists)
    const validRows = alumniData
      .filter((row: any) => row.email)
      .map((row: any) => ({
        full_name: row.full_name || row.name || "Unknown",
        email: row.email,
        graduation_year: row.graduation_year?.toString() || null,
        branch: row.branch || null,
        linkedin_url: row.linkedin_url || null,
        current_company: row.current_company || null,
        role_title: row.role_title || null,
        is_mentor: row.is_mentor === "true" || row.is_mentor === true,
      }));

    if (validRows.length === 0) {
      return NextResponse.json({ error: "None of the provided rows contained a valid 'email'." }, { status: 400 });
    }

    // Upsert into Supabase (requires 'email' to be UNIQUE in the database schema)
    const { error: insertError } = await supabaseService
      .from('alumni_profiles')
      .upsert(validRows, { onConflict: 'email' });

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully uploaded and synced ${validRows.length} alumni records.`,
      count: validRows.length 
    });

  } catch (error: any) {
    console.error("Bulk Upload Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
