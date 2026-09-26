const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:DWIFVKNwMud0Ppjh@db.watyfgympouiyvfauorv.supabase.co:5432/postgres'
});

const sql = `
-- Psychometric Assessments Table (Harrison & Behavioral Simulation)

CREATE TABLE IF NOT EXISTS psychometric_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    student_name TEXT,
    target_role TEXT,
    
    -- Harrison / Behavioral Traits (0 to 100)
    analytical_ability INTEGER NOT NULL,
    execution_delivery INTEGER NOT NULL,
    interpersonal_skills INTEGER NOT NULL,
    team_collaboration INTEGER NOT NULL,
    leadership_potential INTEGER NOT NULL,
    stress_tolerance INTEGER NOT NULL,
    adaptability INTEGER NOT NULL,
    detail_orientation INTEGER NOT NULL,
    
    -- AI Generated Report
    summary_report TEXT NOT NULL,
    
    -- Raw Answers
    raw_answers JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Disable RLS to allow direct inserts from API (or add policies if preferred)
ALTER TABLE psychometric_assessments DISABLE ROW LEVEL SECURITY;
`;

async function run() {
  try {
    await client.connect();
    console.log("Connected to Supabase.");
    await client.query(sql);
    console.log("SQL executed successfully!");
  } catch (error) {
    console.error("Error executing SQL:", error);
  } finally {
    await client.end();
  }
}

run();
