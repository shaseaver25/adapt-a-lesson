-- STEP 1: Secure the parent table (generated_rubrics)
-- Force RLS
ALTER TABLE public.generated_rubrics FORCE ROW LEVEL SECURITY;

-- Drop any overly permissive policies
DROP POLICY IF EXISTS "Public read access to generated rubrics" ON public.generated_rubrics;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.generated_rubrics;
DROP POLICY IF EXISTS "Allow public read access" ON public.generated_rubrics;

-- Revoke anonymous access
REVOKE ALL ON public.generated_rubrics FROM anon;

-- STEP 2: Secure the child table (rubric_verifications)
-- Force RLS
ALTER TABLE public.rubric_verifications FORCE ROW LEVEL SECURITY;

-- Drop all existing public/permissive policies
DROP POLICY IF EXISTS "Public read access to rubric verifications" ON public.rubric_verifications;
DROP POLICY IF EXISTS "Public insert access to rubric verifications" ON public.rubric_verifications;
DROP POLICY IF EXISTS "Public update access to rubric verifications" ON public.rubric_verifications;
DROP POLICY IF EXISTS "Public delete access to rubric verifications" ON public.rubric_verifications;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.rubric_verifications;
DROP POLICY IF EXISTS "Allow public read access" ON public.rubric_verifications;

-- Create strict user-only policies for rubric_verifications
CREATE POLICY "Users can view own rubric verifications"
ON public.rubric_verifications
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.generated_rubrics gr
    WHERE gr.id = rubric_verifications.rubric_id
    AND gr.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own rubric verifications"
ON public.rubric_verifications
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.generated_rubrics gr
    WHERE gr.id = rubric_verifications.rubric_id
    AND gr.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own rubric verifications"
ON public.rubric_verifications
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.generated_rubrics gr
    WHERE gr.id = rubric_verifications.rubric_id
    AND gr.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.generated_rubrics gr
    WHERE gr.id = rubric_verifications.rubric_id
    AND gr.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own rubric verifications"
ON public.rubric_verifications
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.generated_rubrics gr
    WHERE gr.id = rubric_verifications.rubric_id
    AND gr.user_id = auth.uid()
  )
);

-- Revoke anonymous access completely
REVOKE ALL ON public.rubric_verifications FROM anon;

-- STEP 3: Add performance indexes
CREATE INDEX IF NOT EXISTS idx_generated_rubrics_user_id 
ON public.generated_rubrics(user_id);

CREATE INDEX IF NOT EXISTS idx_rubric_verifications_rubric_id 
ON public.rubric_verifications(rubric_id);