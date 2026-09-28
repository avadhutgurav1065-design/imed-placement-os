const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.rpc('execute_sql', {
    sql_query: "ALTER TABLE public.gap_analyses ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';"
  });

  if (error) {
    console.log("RPC might not exist, using raw REST API or just ignoring if we can't add it. Alternatively, I can just use a separate 'job_status' table.", error);
  } else {
    console.log("Success:", data);
  }
}
run();
