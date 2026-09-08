import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function masterSeed() {
  console.log("Seeding Database via Official API...");

  // 1. Admin
  const { data: adminData } = await supabase.auth.admin.createUser({
    email: 'admin@imed.edu', password: 'password123', email_confirm: true, user_metadata: { role: 'admin' }
  });
  if (adminData.user) {
    await supabase.from('admin_profiles').insert({
      id: adminData.user.id, email: 'admin@imed.edu', full_name: 'System Admin', role: 'admin'
    });
  }

  // 1.5 System Admin
  const { data: sysAdminData } = await supabase.auth.admin.createUser({
    email: 'systemadmin@imed.edu', password: 'password123', email_confirm: true, user_metadata: { role: 'admin' }
  });
  if (sysAdminData.user) {
    await supabase.from('admin_profiles').insert({
      id: sysAdminData.user.id, email: 'systemadmin@imed.edu', full_name: 'Master System Admin', role: 'admin'
    });
  }

  // 2. Student 1
  const { data: s1 } = await supabase.auth.admin.createUser({
    email: 'student1@imed.edu', password: 'password123', email_confirm: true, user_metadata: { role: 'student' }
  });
  if (s1.user) {
    await supabase.from('student_profiles').insert({
      id: s1.user.id, email: 'student1@imed.edu', full_name: 'Aditi Sharma', role: 'student', branch: 'BCA', batch_year: '2024', readiness_score: 82
    });
    // Add gap analysis for Student 1
    await supabase.from('gap_analyses').insert({
      user_id: s1.user.id, target_role: 'Frontend Engineer', student_name: 'Aditi Sharma', match_score: 82, missing_skills: ['System Design', 'Cloud Native'], action_plan: ['Read DDIA', 'Learn Kubernetes']
    });
    // Placement
    await supabase.from('placement_records').insert({
      student_id: s1.user.id, company_name: 'Google', offer_ctc_lpa: 15, offer_date: new Date().toISOString(), tier: 'day_1', verified_by_admin: true
    });
  }

  // 3. Alumni 1
  const { data: a1 } = await supabase.auth.admin.createUser({
    email: 'alumni1@imed.edu', password: 'password123', email_confirm: true, user_metadata: { role: 'alumni' }
  });
  if (a1.user) {
    await supabase.from('alumni_profiles').insert({
      id: a1.user.id, email: 'alumni1@imed.edu', full_name: 'Rohan Gupta', role: 'alumni', graduation_year: '2020', branch: 'IT', current_company: 'Microsoft', role_title: 'SDE II', is_mentor: true, engagement_score: 450
    });
    // Referral
    await supabase.from('job_referrals').insert({
      alumni_id: a1.user.id, company: 'Microsoft', role_title: 'SDE II', location: 'Remote', description: 'Looking for smart freshers.', referral_link: 'https://careers.microsoft.com'
    });
  }

  // Jobs
  const { data: job } = await supabase.from('corporate_jobs').insert({
    company_name: 'Google', role_title: 'Frontend Engineer', raw_requirements: 'Strong React and TS.'
  }).select().single();

  if (job) {
    await supabase.from('campus_drives').insert({
      company_name: 'Google', role_title: 'Frontend Engineer', drive_date: new Date(Date.now() + 27 * 86400000).toISOString(), max_slots: 100, min_match_score: 75, status: 'active', job_id: job.id
    });
  }

  console.log("✅ Seed complete! You can log in flawlessly now.");
}

masterSeed().catch(console.error);
