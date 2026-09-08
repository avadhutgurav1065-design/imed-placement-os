import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixAuth() {
  console.log("Connecting to:", supabaseUrl);
  
  // List of all UUIDs from the dummy data script
  const uuids = [
    '00000000-0000-4000-a000-000000000000', // admin
    '10000000-0000-4000-a000-000000000001', // student1
    '10000000-0000-4000-a000-000000000002', // student2
    '20000000-0000-4000-a000-000000000001', // alumni1
    '20000000-0000-4000-a000-000000000002', // alumni2
  ];

  for (const id of uuids) {
    console.log(`Fixing auth for ${id}...`);
    const { data, error } = await supabase.auth.admin.updateUserById(id, {
      password: 'password123',
      email_confirm: true,
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: {}
    });

    if (error) {
      console.error(`❌ Failed to update ${id}: ${error.message}`);
    } else {
      console.log(`✅ Fixed auth for ${data.user.email}`);
    }
  }
  
  console.log("Done!");
}

fixAuth().catch(console.error);
