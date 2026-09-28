const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:DWIFVKNwMud0Ppjh@db.watyfgympouiyvfauorv.supabase.co:5432/postgres'
});

async function run() {
  await client.connect();
  try {
    await client.query("ALTER TABLE gap_analyses ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';");
    await client.query("ALTER TABLE gap_analyses ADD COLUMN IF NOT EXISTS job_id UUID DEFAULT gen_random_uuid();");
    console.log("Columns added.");
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
