-- =======================================================
-- IMED PLACEMENT OS - DATABASE SCHEMA & RLS POLICIES
-- =======================================================

-- 1. Create Profile Tables
-- (id matches auth.users.id)

CREATE TABLE IF NOT EXISTS public.student_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'student',
  branch TEXT,
  batch_year TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.alumni_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'alumni',
  company TEXT,
  designation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admin_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Other Core Tables (Mockups based on codebase queries)

CREATE TABLE IF NOT EXISTS public.gap_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.student_profiles(id),
  student_name TEXT,
  match_score INTEGER,
  missing_skills JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.campus_drives (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'upcoming',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.action_plan_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id UUID REFERENCES public.gap_analyses(id),
  is_completed BOOLEAN DEFAULT FALSE,
  task_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

-- -------------------------------------------------------
-- Helper function to check if user is Admin
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
-- Profile Policies
-- -------------------------------------------------------
-- Students can read their own profile, Admins can read all
CREATE POLICY "Students can view own profile" ON public.student_profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Admins can insert/update student profiles" ON public.student_profiles
  FOR ALL USING (public.is_admin());

-- Alumni can read their own profile, Admins can read all
CREATE POLICY "Alumni can view own profile" ON public.alumni_profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Admins can insert/update alumni profiles" ON public.alumni_profiles
  FOR ALL USING (public.is_admin());

-- Admin profile access
CREATE POLICY "Admins can view own profile" ON public.admin_profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

-- -------------------------------------------------------
-- Analytics & Scans Policies
-- -------------------------------------------------------
-- Students can see their own scans; Admins can see all
CREATE POLICY "Students see own gap analyses" ON public.gap_analyses
  FOR SELECT USING (student_id = auth.uid() OR public.is_admin());

CREATE POLICY "Admins can manage gap analyses" ON public.gap_analyses
  FOR ALL USING (public.is_admin());

-- -------------------------------------------------------
-- Campus Drives Policies
-- -------------------------------------------------------
-- Everyone can view drives, only Admins can manage
CREATE POLICY "Anyone can view drives" ON public.campus_drives
  FOR SELECT USING (TRUE);

CREATE POLICY "Admins manage drives" ON public.campus_drives
  FOR ALL USING (public.is_admin());

-- -------------------------------------------------------
-- Action Plan Policies
-- -------------------------------------------------------
CREATE POLICY "Students see own action plans" ON public.action_plan_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.gap_analyses
      WHERE public.gap_analyses.id = public.action_plan_progress.analysis_id
      AND public.gap_analyses.student_id = auth.uid()
    ) OR public.is_admin()
  );

CREATE POLICY "Students can update own action plans" ON public.action_plan_progress
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.gap_analyses
      WHERE public.gap_analyses.id = public.action_plan_progress.analysis_id
      AND public.gap_analyses.student_id = auth.uid()
    )
  );

CREATE POLICY "Admins manage action plans" ON public.action_plan_progress
  FOR ALL USING (public.is_admin());
