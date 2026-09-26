import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function masterSeed() {
  console.log("🚀 Seeding Production Database via Official API...\n");

  // ── 1. ADMIN ──────────────────────────────────────────
  console.log("Creating admin@imed.edu...");
  const { data: adminData, error: adminErr } = await supabase.auth.admin.createUser({
    email: 'admin@imed.edu', password: 'password123', email_confirm: true, user_metadata: { role: 'admin' }
  });
  if (adminErr && !adminErr.message.includes('already been registered')) console.error("  ❌", adminErr.message);
  if (adminData?.user) {
    await supabase.from('admin_profiles').upsert({ id: adminData.user.id, email: 'admin@imed.edu', full_name: 'System Admin', role: 'admin' });
    console.log("  ✅ admin@imed.edu created");
  }

  console.log("Creating systemadmin@imed.edu...");
  const { data: sysData, error: sysErr } = await supabase.auth.admin.createUser({
    email: 'systemadmin@imed.edu', password: 'password123', email_confirm: true, user_metadata: { role: 'admin' }
  });
  if (sysErr && !sysErr.message.includes('already been registered')) console.error("  ❌", sysErr.message);
  if (sysData?.user) {
    await supabase.from('admin_profiles').upsert({ id: sysData.user.id, email: 'systemadmin@imed.edu', full_name: 'Master System Admin', role: 'admin' });
    console.log("  ✅ systemadmin@imed.edu created");
  }

  // ── 2. STUDENTS ───────────────────────────────────────
  const students = [
    { email: 'student1@imed.edu', name: 'Aditi Sharma', branch: 'BCA', batch: '2024', score: 82 },
    { email: 'student2@imed.edu', name: 'Rahul Patel', branch: 'IT', batch: '2024', score: 74 },
    { email: 'student3@imed.edu', name: 'Priya Joshi', branch: 'CS', batch: '2025', score: 91 },
    { email: 'student4@imed.edu', name: 'Vikram Singh', branch: 'BCA', batch: '2025', score: 65 },
    { email: 'student5@imed.edu', name: 'Sneha Kulkarni', branch: 'IT', batch: '2024', score: 88 },
  ];

  const studentIds: Record<string, string> = {};

  for (const s of students) {
    console.log(`Creating ${s.email}...`);
    const { data, error } = await supabase.auth.admin.createUser({
      email: s.email, password: 'password123', email_confirm: true, user_metadata: { role: 'student' }
    });
    if (error && !error.message.includes('already been registered')) console.error("  ❌", error.message);
    if (data?.user) {
      studentIds[s.email] = data.user.id;
      await supabase.from('student_profiles').upsert({
        id: data.user.id, email: s.email, full_name: s.name, role: 'student',
        branch: s.branch, batch_year: s.batch, readiness_score: s.score,
        skills: ['JavaScript', 'React', 'Node.js', 'SQL', 'Python'].slice(0, 3 + Math.floor(Math.random() * 3))
      });
      console.log(`  ✅ ${s.email} created`);
    }
  }

  // ── 3. ALUMNI ─────────────────────────────────────────
  const alumni = [
    { email: 'alumni1@imed.edu', name: 'Rohan Gupta', grad: '2020', branch: 'IT', company: 'Microsoft', title: 'SDE II' },
    { email: 'alumni2@imed.edu', name: 'Ananya Desai', grad: '2019', branch: 'CS', company: 'Google', title: 'Staff Engineer' },
    { email: 'alumni3@imed.edu', name: 'Karan Mehta', grad: '2021', branch: 'BCA', company: 'Amazon', title: 'SDE I' },
  ];

  const alumniIds: Record<string, string> = {};

  for (const a of alumni) {
    console.log(`Creating ${a.email}...`);
    const { data, error } = await supabase.auth.admin.createUser({
      email: a.email, password: 'password123', email_confirm: true, user_metadata: { role: 'alumni' }
    });
    if (error && !error.message.includes('already been registered')) console.error("  ❌", error.message);
    if (data?.user) {
      alumniIds[a.email] = data.user.id;
      await supabase.from('alumni_profiles').upsert({
        id: data.user.id, email: a.email, full_name: a.name, role: 'alumni',
        graduation_year: a.grad, branch: a.branch, current_company: a.company,
        role_title: a.title, is_mentor: true, engagement_score: 300 + Math.floor(Math.random() * 200)
      });
      console.log(`  ✅ ${a.email} created`);
    }
  }

  // ── 4. CORPORATE JOBS ─────────────────────────────────
  console.log("\nInserting corporate jobs...");
  const { data: jobs } = await supabase.from('corporate_jobs').upsert([
    { company_name: 'Google', role_title: 'Frontend Engineer', raw_requirements: 'Strong React, TypeScript, CSS, Web Performance, System Design, CI/CD. 2+ years experience preferred.', location: 'Bangalore', source: 'linkedin' },
    { company_name: 'Microsoft', role_title: 'SDE II', raw_requirements: 'C#, .NET, Azure, Microservices, SQL Server, REST APIs, Design Patterns. Strong DSA fundamentals.', location: 'Hyderabad', source: 'linkedin' },
    { company_name: 'Amazon', role_title: 'Data Analyst', raw_requirements: 'SQL, Python, Tableau, Statistical Analysis, A/B Testing, ETL Pipelines, AWS Redshift.', location: 'Mumbai', source: 'manual' },
    { company_name: 'Infosys', role_title: 'Full Stack Developer', raw_requirements: 'Java, Spring Boot, React, MySQL, Docker, Agile methodology, Unit testing.', location: 'Pune', source: 'manual' },
    { company_name: 'TCS', role_title: 'Business Analyst', raw_requirements: 'Requirements gathering, process mapping, JIRA, Confluence, stakeholder management, SQL basics.', location: 'Chennai', source: 'manual' },
  ], { onConflict: 'id' }).select();
  console.log(`  ✅ ${jobs?.length || 0} jobs inserted`);

  // ── 5. CAMPUS DRIVES ──────────────────────────────────
  console.log("Inserting campus drives...");
  const driveData = [
    { company_name: 'Google', role_title: 'Frontend Engineer', title: 'Google Campus Hiring 2025', drive_date: new Date(Date.now() + 14 * 86400000).toISOString(), max_slots: 50, min_match_score: 75, status: 'active', job_id: jobs?.[0]?.id },
    { company_name: 'Microsoft', role_title: 'SDE II', title: 'Microsoft On-Campus Drive', drive_date: new Date(Date.now() + 30 * 86400000).toISOString(), max_slots: 30, min_match_score: 80, status: 'upcoming', job_id: jobs?.[1]?.id },
    { company_name: 'Infosys', role_title: 'Full Stack Developer', title: 'Infosys Pool Drive', drive_date: new Date(Date.now() + 7 * 86400000).toISOString(), max_slots: 200, min_match_score: 60, status: 'active', job_id: jobs?.[3]?.id },
  ];
  await supabase.from('campus_drives').upsert(driveData, { onConflict: 'id' });
  console.log("  ✅ Campus drives inserted");

  // ── 6. JOB REFERRALS ──────────────────────────────────
  console.log("Inserting alumni referrals...");
  if (alumniIds['alumni1@imed.edu']) {
    await supabase.from('job_referrals').insert([
      { alumni_id: alumniIds['alumni1@imed.edu'], company: 'Microsoft', role_title: 'SDE II', location: 'Remote', description: 'Looking for strong freshers with DSA skills.', referral_link: 'https://careers.microsoft.com' },
      { alumni_id: alumniIds['alumni1@imed.edu'], company: 'Microsoft', role_title: 'PM Intern', location: 'Bangalore', description: 'Product Management internship for final year students.', referral_link: 'https://careers.microsoft.com' },
    ]);
  }
  if (alumniIds['alumni2@imed.edu']) {
    await supabase.from('job_referrals').insert([
      { alumni_id: alumniIds['alumni2@imed.edu'], company: 'Google', role_title: 'SWE Intern', location: 'Hyderabad', description: 'Summer internship for pre-final year students.', referral_link: 'https://careers.google.com' },
    ]);
  }
  console.log("  ✅ Referrals inserted");

  // ── 7. GAP ANALYSES (sample scan results) ─────────────
  console.log("Inserting sample gap analyses...");
  if (studentIds['student1@imed.edu']) {
    await supabase.from('gap_analyses').insert([
      { user_id: studentIds['student1@imed.edu'], target_role: 'Frontend Engineer', student_name: 'Aditi Sharma', match_score: 82, missing_skills: ['System Design', 'Cloud Native', 'CI/CD'], action_plan: ['Read DDIA book', 'Build a CI/CD pipeline', 'Deploy on AWS'] },
      { user_id: studentIds['student1@imed.edu'], target_role: 'Full Stack Developer', student_name: 'Aditi Sharma', match_score: 71, missing_skills: ['Docker', 'PostgreSQL', 'GraphQL'], action_plan: ['Complete Docker tutorial', 'Build REST + GraphQL API'] },
    ]);
  }
  if (studentIds['student3@imed.edu']) {
    await supabase.from('gap_analyses').insert([
      { user_id: studentIds['student3@imed.edu'], target_role: 'Data Analyst', student_name: 'Priya Joshi', match_score: 91, missing_skills: ['Tableau'], action_plan: ['Complete Tableau certification'] },
    ]);
  }
  console.log("  ✅ Gap analyses inserted");

  // ── 8. PLACEMENT RECORDS ──────────────────────────────
  console.log("Inserting placement records...");
  if (studentIds['student1@imed.edu']) {
    await supabase.from('placement_records').insert({
      student_id: studentIds['student1@imed.edu'], company_name: 'Google', offer_ctc_lpa: 15, offer_date: new Date().toISOString(), tier: 'day_1', verified_by_admin: true
    });
  }
  if (studentIds['student3@imed.edu']) {
    await supabase.from('placement_records').insert({
      student_id: studentIds['student3@imed.edu'], company_name: 'Amazon', offer_ctc_lpa: 12, offer_date: new Date().toISOString(), tier: 'day_1', verified_by_admin: true
    });
  }
  console.log("  ✅ Placement records inserted");

  // ── DONE ──────────────────────────────────────────────
  console.log("\n🎉 ══════════════════════════════════════════");
  console.log("   SEED COMPLETE! All features should work.");
  console.log("   ══════════════════════════════════════════");
  console.log("\n   Login credentials (all use password: password123):");
  console.log("   Admin:   admin@imed.edu / systemadmin@imed.edu");
  console.log("   Students: student1@imed.edu through student5@imed.edu");
  console.log("   Alumni:  alumni1@imed.edu through alumni3@imed.edu");
}

masterSeed().catch(console.error);
