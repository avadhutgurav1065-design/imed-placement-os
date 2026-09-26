const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:DWIFVKNwMud0Ppjh@db.watyfgympouiyvfauorv.supabase.co:5432/postgres'
});

async function run() {
  try {
    await client.connect();
    const res = await client.query('SELECT * FROM campus_drives');
    console.log("Drives:", res.rows);
  } catch (error) {
    console.error("Error executing SQL:", error);
  } finally {
    await client.end();
  }
}

run();
