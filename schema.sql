-- =======================================================
-- IMED PLACEMENT OS - COMPLETE PRODUCTION SCHEMA
-- Run this in Supabase SQL Editor (watyfgympouiyvfauorv)
-- =======================================================
-- WARNING: This will DROP and recreate all tables.
-- Only run on a fresh or development database.
-- =======================================================

-- 0. Drop existing tables (in dependency order)
DROP TABLE IF EXISTS public.action_plan_progress CASCADE;
DROP TABLE IF EXISTS public.gap_analyses CASCADE;
DROP TABLE IF EXISTS public.psychometric_assessments CASCADE;
DROP TABLE IF EXISTS public.generated_resumes CASCADE;
DROP TABLE IF EXISTS public.campus_drive_registrations CASCADE;
DROP TABLE IF EXISTS public.campus_drives CASCADE;
DROP TABLE IF EXISTS public.corporate_jobs CASCADE;
DROP TABLE IF EXISTS public.placement_records CASCADE;
DROP TABLE IF EXISTS public.job_referrals CASCADE;
DROP TABLE IF EXISTS public.mentor_sessions CASCADE;
DROP TABLE IF EXISTS public.donations CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.interview_logs CASCADE;
DROP TABLE IF EXISTS public.student_profiles CASCADE;
DROP TABLE IF EXISTS public.alumni_profiles CASCADE;
DROP TABLE IF EXISTS public.admin_profiles CASCADE;

-- =======================================================
-- 1. PROFILE TABLES (id matches auth.users.id)
-- =======================================================

CREATE TABLE public.student_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'student',
  branch TEXT,
  batch_year TEXT,
  readiness_score INTEGER DEFAULT 0,
  phone TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  skills JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.alumni_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'alumni',
  graduation_year TEXT,
  branch TEXT,
  current_company TEXT,
  role_title TEXT,
  linkedin_url TEXT,
  is_mentor BOOLEAN DEFAULT false,
  engagement_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.admin_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =======================================================
-- 2. CORPORATE JOBS (ingested JDs for matching)
-- =======================================================

CREATE TABLE public.corporate_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  role_title TEXT NOT NULL,
  raw_requirements TEXT,
  location TEXT,
  salary_range TEXT,
  source TEXT DEFAULT 'manual',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =======================================================
-- 3. GAP ANALYSES (AI resume scan results)
-- =======================================================

CREATE TABLE public.gap_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  target_role TEXT,
  student_name TEXT,
  match_score INTEGER DEFAULT 0,
  missing_skills JSONB DEFAULT '[]'::jsonb,
  action_plan JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =======================================================
-- 4. ACTION PLAN PROGRESS
-- =======================================================

CREATE TABLE public.action_plan_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id UUID REFERENCES public.gap_analyses(id) ON DELETE CASCADE,
  task_description TEXT,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =======================================================
-- 5. PSYCHOMETRIC ASSESSMENTS
-- =======================================================

CREATE TABLE public.psychometric_assessments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  student_name TEXT,
  target_role TEXT,
  raw_answers JSONB,
  analytical_ability INTEGER DEFAULT 0,
  execution_delivery INTEGER DEFAULT 0,
  interpersonal_skills INTEGER DEFAULT 0,
  team_collaboration INTEGER DEFAULT 0,
  leadership_potential INTEGER DEFAULT 0,
  stress_tolerance INTEGER DEFAULT 0,
  adaptability INTEGER DEFAULT 0,
  detail_orientation INTEGER DEFAULT 0,
  summary_report TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =======================================================
-- 6. GENERATED RESUMES (AI Resume Builder)
-- =======================================================

CREATE TABLE public.generated_resumes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  job_description_text TEXT,
  resume_json JSONB,
  ats_score_predicted INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =======================================================
-- 7. CAMPUS DRIVES
-- =======================================================

CREATE TABLE public.campus_drives (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  role_title TEXT,
  drive_date TIMESTAMPTZ,
  max_slots INTEGER DEFAULT 100,
  min_match_score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'upcoming',
  job_id UUID REFERENCES public.corporate_jobs(id) ON DELETE SET NULL,
  title TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =======================================================
-- 8. CORPORATE DRIVE LINKS (Magic Links for Recruiters)
-- =======================================================
CREATE TABLE public.corporate_drive_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  magic_token TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES public.admin_profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =======================================================
-- 9. CAMPUS DRIVE REGISTRATIONS
-- =======================================================

CREATE TABLE public.campus_drive_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  drive_id UUID REFERENCES public.campus_drives(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'registered',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(drive_id, student_id)
);

-- =======================================================
-- 9. PLACEMENT RECORDS
-- =======================================================

CREATE TABLE public.placement_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  offer_ctc_lpa NUMERIC,
  offer_date TIMESTAMPTZ,
  tier TEXT,
  verified_by_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =======================================================
-- 10. JOB REFERRALS (Alumni -> Students)
-- =======================================================

CREATE TABLE public.job_referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  alumni_id UUID REFERENCES public.alumni_profiles(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  role_title TEXT,
  location TEXT,
  description TEXT,
  referral_link TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =======================================================
-- 11. MENTOR SESSIONS
-- =======================================================

CREATE TABLE public.mentor_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  alumni_id UUID REFERENCES public.alumni_profiles(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  topic TEXT,
  status TEXT DEFAULT 'requested',
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =======================================================
-- 12. DONATIONS (Alumni fundraising)
-- =======================================================

CREATE TABLE public.donations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  alumni_id UUID REFERENCES public.alumni_profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  purpose TEXT,
  transaction_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =======================================================
-- 13. NOTIFICATIONS
-- =======================================================

CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =======================================================
-- 14. INTERVIEW LOGS
-- =======================================================

CREATE TABLE public.interview_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  target_role TEXT,
  questions JSONB,
  answers JSONB,
  ai_feedback JSONB,
  overall_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =======================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =======================================================

-- Enable RLS on all tables
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gap_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campus_drives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_plan_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.psychometric_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campus_drive_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placement_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_logs ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------
-- Helper: Check if current user is Admin
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_profiles WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -------------------------------------------------------
-- PROFILE POLICIES
-- -------------------------------------------------------

-- Students
CREATE POLICY "Students read own profile" ON public.student_profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "Students update own profile" ON public.student_profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "Admins manage student profiles" ON public.student_profiles
  FOR ALL USING (public.is_admin());

-- Alumni
CREATE POLICY "Alumni read own profile" ON public.alumni_profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "Alumni update own profile" ON public.alumni_profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "Admins manage alumni profiles" ON public.alumni_profiles
  FOR ALL USING (public.is_admin());

-- Admin
CREATE POLICY "Admins read own profile" ON public.admin_profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

-- -------------------------------------------------------
-- ANALYTICS & AI FEATURE POLICIES
-- -------------------------------------------------------

-- Gap Analyses
CREATE POLICY "Students see own gap analyses" ON public.gap_analyses
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "Students insert own gap analyses" ON public.gap_analyses
  FOR INSERT WITH CHECK (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "Admins manage gap analyses" ON public.gap_analyses
  FOR ALL USING (public.is_admin());

-- Psychometric Assessments
CREATE POLICY "Students see own psychometrics" ON public.psychometric_assessments
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "Students insert own psychometrics" ON public.psychometric_assessments
  FOR INSERT WITH CHECK (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "Admins manage psychometrics" ON public.psychometric_assessments
  FOR ALL USING (public.is_admin());

-- Generated Resumes
CREATE POLICY "Students see own resumes" ON public.generated_resumes
  FOR SELECT USING (student_id = auth.uid() OR public.is_admin());
CREATE POLICY "Students insert own resumes" ON public.generated_resumes
  FOR INSERT WITH CHECK (student_id = auth.uid() OR public.is_admin());
CREATE POLICY "Admins manage resumes" ON public.generated_resumes
  FOR ALL USING (public.is_admin());

-- Action Plan Progress
CREATE POLICY "Students see own action plans" ON public.action_plan_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.gap_analyses
      WHERE gap_analyses.id = action_plan_progress.analysis_id
      AND gap_analyses.user_id = auth.uid()
    ) OR public.is_admin()
  );
CREATE POLICY "Students update own action plans" ON public.action_plan_progress
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.gap_analyses
      WHERE gap_analyses.id = action_plan_progress.analysis_id
      AND gap_analyses.user_id = auth.uid()
    )
  );
CREATE POLICY "Admins manage action plans" ON public.action_plan_progress
  FOR ALL USING (public.is_admin());

-- -------------------------------------------------------
-- CAMPUS DRIVES & JOBS POLICIES
-- -------------------------------------------------------

-- Corporate Jobs (everyone can view, admins manage)
CREATE POLICY "Anyone can view jobs" ON public.corporate_jobs
  FOR SELECT USING (true);
CREATE POLICY "Admins manage jobs" ON public.corporate_jobs
  FOR ALL USING (public.is_admin());

-- Campus Drives
CREATE POLICY "Anyone can view drives" ON public.campus_drives
  FOR SELECT USING (true);
CREATE POLICY "Admins manage drives" ON public.campus_drives
  FOR ALL USING (public.is_admin());

-- Drive Registrations
CREATE POLICY "Students see own registrations" ON public.campus_drive_registrations
  FOR SELECT USING (student_id = auth.uid() OR public.is_admin());
CREATE POLICY "Students register for drives" ON public.campus_drive_registrations
  FOR INSERT WITH CHECK (student_id = auth.uid());
CREATE POLICY "Admins manage registrations" ON public.campus_drive_registrations
  FOR ALL USING (public.is_admin());

-- Placement Records
CREATE POLICY "Students see own placements" ON public.placement_records
  FOR SELECT USING (student_id = auth.uid() OR public.is_admin());
CREATE POLICY "Admins manage placements" ON public.placement_records
  FOR ALL USING (public.is_admin());

-- -------------------------------------------------------
-- ALUMNI FEATURE POLICIES
-- -------------------------------------------------------

-- Job Referrals
CREATE POLICY "Anyone can view referrals" ON public.job_referrals
  FOR SELECT USING (true);
CREATE POLICY "Alumni manage own referrals" ON public.job_referrals
  FOR INSERT WITH CHECK (alumni_id = auth.uid());
CREATE POLICY "Alumni update own referrals" ON public.job_referrals
  FOR UPDATE USING (alumni_id = auth.uid() OR public.is_admin());
CREATE POLICY "Admins manage referrals" ON public.job_referrals
  FOR ALL USING (public.is_admin());

-- Mentor Sessions
CREATE POLICY "Participants see own sessions" ON public.mentor_sessions
  FOR SELECT USING (alumni_id = auth.uid() OR student_id = auth.uid() OR public.is_admin());
CREATE POLICY "Students request sessions" ON public.mentor_sessions
  FOR INSERT WITH CHECK (student_id = auth.uid());
CREATE POLICY "Alumni update own sessions" ON public.mentor_sessions
  FOR UPDATE USING (alumni_id = auth.uid() OR public.is_admin());
CREATE POLICY "Admins manage sessions" ON public.mentor_sessions
  FOR ALL USING (public.is_admin());

-- Donations
CREATE POLICY "Alumni see own donations" ON public.donations
  FOR SELECT USING (alumni_id = auth.uid() OR public.is_admin());
CREATE POLICY "Alumni make donations" ON public.donations
  FOR INSERT WITH CHECK (alumni_id = auth.uid());
CREATE POLICY "Admins manage donations" ON public.donations
  FOR ALL USING (public.is_admin());

-- -------------------------------------------------------
-- NOTIFICATIONS & INTERVIEW LOGS
-- -------------------------------------------------------

CREATE POLICY "Users see own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "System inserts notifications" ON public.notifications
  FOR INSERT WITH CHECK (public.is_admin() OR user_id = auth.uid());

CREATE POLICY "Students see own interview logs" ON public.interview_logs
  FOR SELECT USING (student_id = auth.uid() OR public.is_admin());
CREATE POLICY "Students insert own interview logs" ON public.interview_logs
  FOR INSERT WITH CHECK (student_id = auth.uid() OR public.is_admin());
CREATE POLICY "Admins manage interview logs" ON public.interview_logs
  FOR ALL USING (public.is_admin());

-- Corporate Drive Links
ALTER TABLE public.corporate_drive_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active drive links" ON public.corporate_drive_links
  FOR SELECT USING (status = 'Active');
CREATE POLICY "Admins manage drive links" ON public.corporate_drive_links
  FOR ALL USING (public.is_admin());

-- =======================================================
-- DONE! Schema is fully aligned with all API routes.
-- =======================================================
