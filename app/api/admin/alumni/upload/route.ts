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
    const { data: adminProfile } = await supabaseUser
      .from("admin_profiles")
      .select("id")
      .eq("id", user.id)
      .single();
      
    if (!adminProfile) {
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

    const alumniToInsert: any[] = [];
    const errors: string[] = [];

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];

      // Create auth user first (if they don't exist)
      const { data: authData, error: authError } = await supabaseService.auth.admin.createUser({
        email: row.email,
        password: `ALUMNI${Date.now()}!`, // Temporary password
        email_confirm: true,
      });

      if (authError) {
        // User might already exist — try to look them up
        const { data: existingUsers } = await supabaseService.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find((u) => u.email === row.email);

        if (existingUser) {
          alumniToInsert.push({
            id: existingUser.id,
            ...row
          });
        } else {
          errors.push(`Row ${i + 1}: Failed to create user — ${authError.message}`);
        }
        continue;
      }

      alumniToInsert.push({
        id: authData.user.id,
        ...row
      });
    }

    if (alumniToInsert.length === 0) {
      return NextResponse.json({ error: "Failed to create any alumni users.", errors }, { status: 500 });
    }

    // Upsert into Supabase
    const { error: insertError } = await supabaseUser
      .from('alumni_profiles')
      .upsert(alumniToInsert, { onConflict: 'id' });

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
