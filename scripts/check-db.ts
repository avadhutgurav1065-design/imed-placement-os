import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkDb() {
  console.log("Checking login for student1@imed.edu on:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'student1@imed.edu',
    password: 'password123'
  });

  if (error) {
    console.error("Login failed:", error);
  } else {
    console.log("Login successful! User ID:", data.user.id);
  }
}

checkDb().catch(console.error);
