import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const admins = users.filter(u => u.user_metadata?.role === 'admin' || (u.email && u.email.includes('admin')));
  for (const a of admins) {
    await supabase.from('admin_profiles').upsert({ id: a.id, email: a.email, full_name: 'Admin', role: 'admin' });
    console.log('Upserted admin profile for:', a.email);
  }
})();
