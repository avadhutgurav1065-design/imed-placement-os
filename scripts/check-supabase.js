import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSupabase() {
  console.log("Checking Supabase connection and tables...");

  // Check auth users
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error("Error fetching auth users:", authError.message);
  } else {
    console.log(`Found ${authData?.users?.length || 0} users in auth.users`);
  }

  const tablesToCheck = [
    'student_profiles',
    'alumni_profiles',
    'admin_profiles',
    'gap_analyses',
    'campus_drives',
    'action_plan_progress'
  ];

  for (const table of tablesToCheck) {
    const { data, error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log(`Table '${table}': DOES NOT EXIST or Error (${error.message})`);
    } else {
      console.log(`Table '${table}': EXISTS (Count: ${count})`);
    }
  }
}

checkSupabase();
