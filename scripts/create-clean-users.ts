import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function createCleanUsers() {
  console.log("Creating clean users via API...");

  const users = [
    { email: 'admin@imed.edu', role: 'admin', id: '00000000-0000-4000-a000-000000000000' },
    { email: 'student1@imed.edu', role: 'student', id: '10000000-0000-4000-a000-000000000001' },
    { email: 'alumni1@imed.edu', role: 'alumni', id: '20000000-0000-4000-a000-000000000001' }
  ];

  for (const u of users) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: 'password123',
      email_confirm: true,
      user_metadata: { role: u.role }
    });

    if (error && !error.message.includes('already been registered')) {
      console.error(`Failed to create ${u.email}:`, error.message);
    } else {
      console.log(`✅ ${u.email} created successfully with proper GoTrue hashing!`);
    }
  }
}

createCleanUsers().catch(console.error);
