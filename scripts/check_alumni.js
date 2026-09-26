const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:DWIFVKNwMud0Ppjh@db.watyfgympouiyvfauorv.supabase.co:5432/postgres'
});

async function run() {
  await client.connect();
  try {
    const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'alumni_profiles'");
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
