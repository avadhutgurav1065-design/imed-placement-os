const postgres = require('postgres');

const sql = postgres('postgresql://postgres:DWIFVKNwMud0Ppjh@db.watyfgympouiyvfauorv.supabase.co:5432/postgres', {
  ssl: 'require'
});

async function run() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS public.student_assessments (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        student_id UUID REFERENCES auth.users(id),
        job_role TEXT NOT NULL,
        assessment_type TEXT NOT NULL,
        score INTEGER NOT NULL,
        total_questions INTEGER NOT NULL,
        difficulty_breakdown JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    await sql`ALTER TABLE public.student_assessments ENABLE ROW LEVEL SECURITY;`;
    
    // We can just drop and recreate policies to be safe
    try {
        await sql`DROP POLICY IF EXISTS "Students see own assessments" ON public.student_assessments;`;
        await sql`DROP POLICY IF EXISTS "Students insert own assessments" ON public.student_assessments;`;
        await sql`DROP POLICY IF EXISTS "Admins manage assessments" ON public.student_assessments;`;
    } catch(e) {}

    await sql`
      CREATE POLICY "Students see own assessments" ON public.student_assessments
        FOR SELECT USING (student_id = auth.uid() OR public.is_admin());
    `;
    
    await sql`
      CREATE POLICY "Students insert own assessments" ON public.student_assessments
        FOR INSERT WITH CHECK (student_id = auth.uid());
    `;

    await sql`
      CREATE POLICY "Admins manage assessments" ON public.student_assessments
        FOR ALL USING (public.is_admin());
    `;

    console.log("Migration successful!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await sql.end();
  }
}

run();
