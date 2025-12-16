-- CRITICAL SECURITY FIX: RLS Hardening for User Data Tables

-- ============================================
-- 1. PROFILES TABLE SECURITY
-- ============================================

-- Force RLS on profiles table
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

-- Drop ALL existing policies including admin ones
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile creation on signup" ON public.profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Allow public read access" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

-- Create strict policies: users can ONLY access their own data
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
ON public.profiles
FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- Admin policies (using security definer function)
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Revoke all access from anonymous role
REVOKE ALL ON public.profiles FROM anon;

-- ============================================
-- 2. STUDENT_GROUPS TABLE SECURITY (Critical - contains IEP/504 data)
-- ============================================

-- Force RLS on student_groups table
ALTER TABLE public.student_groups FORCE ROW LEVEL SECURITY;

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Public read access to student groups" ON public.student_groups;
DROP POLICY IF EXISTS "Public insert access to student groups" ON public.student_groups;
DROP POLICY IF EXISTS "Public update access to student groups" ON public.student_groups;
DROP POLICY IF EXISTS "Public delete access to student groups" ON public.student_groups;
DROP POLICY IF EXISTS "Users can view own student groups" ON public.student_groups;
DROP POLICY IF EXISTS "Users can insert own student groups" ON public.student_groups;
DROP POLICY IF EXISTS "Users can update own student groups" ON public.student_groups;
DROP POLICY IF EXISTS "Users can delete own student groups" ON public.student_groups;

-- Create strict user-only policies
CREATE POLICY "Users can view own student groups"
ON public.student_groups
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own student groups"
ON public.student_groups
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own student groups"
ON public.student_groups
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own student groups"
ON public.student_groups
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Revoke all access from anonymous role
REVOKE ALL ON public.student_groups FROM anon;

-- ============================================
-- 3. CLASS_FOLDERS TABLE SECURITY
-- ============================================

-- Force RLS
ALTER TABLE public.class_folders FORCE ROW LEVEL SECURITY;

-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "Allow all access to class_folders" ON public.class_folders;
DROP POLICY IF EXISTS "Users can view own class folders" ON public.class_folders;
DROP POLICY IF EXISTS "Users can insert own class folders" ON public.class_folders;
DROP POLICY IF EXISTS "Users can update own class folders" ON public.class_folders;
DROP POLICY IF EXISTS "Users can delete own class folders" ON public.class_folders;

-- Create strict user-only policies
CREATE POLICY "Users can view own class folders"
ON public.class_folders
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own class folders"
ON public.class_folders
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own class folders"
ON public.class_folders
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own class folders"
ON public.class_folders
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Revoke all access from anonymous role
REVOKE ALL ON public.class_folders FROM anon;

-- ============================================
-- 4. GENERATED_LESSONS TABLE SECURITY
-- ============================================

-- Force RLS
ALTER TABLE public.generated_lessons FORCE ROW LEVEL SECURITY;

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Public read access to generated lessons" ON public.generated_lessons;
DROP POLICY IF EXISTS "Public insert access to generated lessons" ON public.generated_lessons;
DROP POLICY IF EXISTS "Public update access to generated lessons" ON public.generated_lessons;
DROP POLICY IF EXISTS "Public delete access to generated lessons" ON public.generated_lessons;
DROP POLICY IF EXISTS "Users can view own lessons" ON public.generated_lessons;
DROP POLICY IF EXISTS "Users can insert own lessons" ON public.generated_lessons;
DROP POLICY IF EXISTS "Users can update own lessons" ON public.generated_lessons;
DROP POLICY IF EXISTS "Users can delete own lessons" ON public.generated_lessons;

-- Create strict user-only policies
CREATE POLICY "Users can view own lessons"
ON public.generated_lessons
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lessons"
ON public.generated_lessons
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lessons"
ON public.generated_lessons
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own lessons"
ON public.generated_lessons
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Revoke all access from anonymous role
REVOKE ALL ON public.generated_lessons FROM anon;

-- ============================================
-- 5. GENERATED_RUBRICS TABLE SECURITY
-- ============================================

-- Force RLS
ALTER TABLE public.generated_rubrics FORCE ROW LEVEL SECURITY;

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Public read access to generated rubrics" ON public.generated_rubrics;
DROP POLICY IF EXISTS "Public insert access to generated rubrics" ON public.generated_rubrics;
DROP POLICY IF EXISTS "Public update access to generated rubrics" ON public.generated_rubrics;
DROP POLICY IF EXISTS "Public delete access to generated rubrics" ON public.generated_rubrics;
DROP POLICY IF EXISTS "Users can view own rubrics" ON public.generated_rubrics;
DROP POLICY IF EXISTS "Users can insert own rubrics" ON public.generated_rubrics;
DROP POLICY IF EXISTS "Users can update own rubrics" ON public.generated_rubrics;
DROP POLICY IF EXISTS "Users can delete own rubrics" ON public.generated_rubrics;

-- Create strict user-only policies
CREATE POLICY "Users can view own rubrics"
ON public.generated_rubrics
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rubrics"
ON public.generated_rubrics
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rubrics"
ON public.generated_rubrics
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own rubrics"
ON public.generated_rubrics
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Revoke all access from anonymous role
REVOKE ALL ON public.generated_rubrics FROM anon;

-- ============================================
-- 6. SAVED_ASSESSMENTS TABLE SECURITY
-- ============================================

-- Force RLS
ALTER TABLE public.saved_assessments FORCE ROW LEVEL SECURITY;

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Public read access to saved assessments" ON public.saved_assessments;
DROP POLICY IF EXISTS "Public insert access to saved assessments" ON public.saved_assessments;
DROP POLICY IF EXISTS "Public update access to saved assessments" ON public.saved_assessments;
DROP POLICY IF EXISTS "Public delete access to saved assessments" ON public.saved_assessments;
DROP POLICY IF EXISTS "Users can view own saved assessments" ON public.saved_assessments;
DROP POLICY IF EXISTS "Users can insert own saved assessments" ON public.saved_assessments;
DROP POLICY IF EXISTS "Users can update own saved assessments" ON public.saved_assessments;
DROP POLICY IF EXISTS "Users can delete own saved assessments" ON public.saved_assessments;

-- Create strict user-only policies
CREATE POLICY "Users can view own saved assessments"
ON public.saved_assessments
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved assessments"
ON public.saved_assessments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved assessments"
ON public.saved_assessments
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved assessments"
ON public.saved_assessments
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Revoke all access from anonymous role
REVOKE ALL ON public.saved_assessments FROM anon;