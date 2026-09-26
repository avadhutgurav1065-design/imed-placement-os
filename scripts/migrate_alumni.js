const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:DWIFVKNwMud0Ppjh@db.watyfgympouiyvfauorv.supabase.co:5432/postgres'
});

async function run() {
  await client.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS alumni_profiles (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        full_name TEXT,
        current_role TEXT,
        current_company TEXT,
        graduation_year INTEGER,
        linkedin_url TEXT UNIQUE,
        match_score INTEGER,
        last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      ALTER TABLE alumni_profiles DISABLE ROW LEVEL SECURITY;
    `);
    console.log('Success');
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
