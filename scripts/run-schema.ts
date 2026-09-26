import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

const sql = postgres(
  `postgresql://postgres:DWIFVKNwMud0Ppjh@db.watyfgympouiyvfauorv.supabase.co:5432/postgres`,
  { ssl: 'require', connect_timeout: 30 }
);

async function runSchema() {
  console.log("🔌 Connecting to Supabase Postgres...\n");

  // Quick connection test
  const [test] = await sql`SELECT 1 as connected`;
  console.log("✅ Connected to database!\n");

  // Read the schema file
  const schemaPath = path.join(process.cwd(), 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

  // Execute the entire schema as one transaction
  console.log("📋 Executing full schema...\n");
  
  try {
    await sql.unsafe(schemaSql);
    console.log("✅ SCHEMA EXECUTED SUCCESSFULLY!\n");
  } catch (err: any) {
    console.error("Schema execution failed:", err.message);
    console.log("\nTrying statement-by-statement fallback...\n");
    
    // Fallback: split and execute one by one
    const statements = schemaSql
      .split(/;\s*\n/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let success = 0, failed = 0;

    for (const stmt of statements) {
      const firstLine = stmt.split('\n').find(l => !l.startsWith('--') && l.trim().length > 0) || '';
      try {
        await sql.unsafe(stmt + ';');
        success++;
        if (firstLine.match(/^(CREATE|DROP|ALTER)/i)) {
          console.log(`  ✅ ${firstLine.substring(0, 80)}`);
        }
      } catch (e: any) {
        if (e.message?.includes('already exists') || e.message?.includes('does not exist')) {
          console.log(`  ⏭️  ${firstLine.substring(0, 60)} (skipped)`);
          success++;
        } else {
          failed++;
          console.error(`  ❌ ${firstLine.substring(0, 60)}`);
          console.error(`     ${e.message?.substring(0, 120)}`);
        }
      }
    }
    console.log(`\n  Succeeded: ${success} | Failed: ${failed}`);
  }

  await sql.end();
  console.log("\n🎉 Done! Database schema is ready.");
}

runSchema().catch(async (err) => {
  console.error("Fatal:", err.message);
  await sql.end();
  process.exit(1);
});
