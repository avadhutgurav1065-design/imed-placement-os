import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const { data: driveLink, error } = await supabase
      .from('corporate_drive_links')
      .select('company_name, status')
      .eq('magic_token', token)
      .single();

    if (error || !driveLink || driveLink.status !== 'Active') {
      return NextResponse.json({ error: "Invalid or expired link" }, { status: 403 });
    }

    return NextResponse.json({ 
      success: true, 
      companyName: driveLink.company_name 
    });

  } catch (error: any) {
    console.error("Drive Link Validation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
