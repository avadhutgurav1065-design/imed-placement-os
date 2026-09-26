const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:DWIFVKNwMud0Ppjh@db.watyfgympouiyvfauorv.supabase.co:5432/postgres'
});

async function run() {
  await client.connect();
  try {
    await client.query("ALTER TABLE alumni_profiles ADD COLUMN last_synced_at TIMESTAMP WITH TIME ZONE;");
    console.log("Column added.");
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
