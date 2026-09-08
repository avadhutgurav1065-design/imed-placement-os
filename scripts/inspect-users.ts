import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function inspectUsers() {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error("Failed to fetch users:", error);
    return;
  }
  console.log(`Found ${data.users.length} users in Auth API.`);
  
  const student = data.users.find(u => u.email === 'student1@imed.edu');
  if (student) {
    console.log("Student1 API Data:", JSON.stringify(student, null, 2));
  } else {
    console.log("Student1 not found via Auth API! (This means instance_id is wrong or missing)");
  }
}
inspectUsers();
