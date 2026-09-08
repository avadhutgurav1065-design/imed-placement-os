import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function fix() {
  const { data, error } = await supabase.auth.admin.updateUserById(
    '10000000-0000-4000-a000-000000000001',
    { password: 'password123' }
  );
  if (error) {
    console.error("Update failed:", error);
  } else {
    console.log("Password updated for student1! Try logging in now.");
  }
}
fix();
