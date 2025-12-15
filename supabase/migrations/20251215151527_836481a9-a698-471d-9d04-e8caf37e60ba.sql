-- Add user_id and organization_id columns for future auth support
ALTER TABLE public.student_groups 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS organization_id UUID;

-- Update RLS policies to support user-based access in the future
DROP POLICY IF EXISTS "Anyone can view student groups" ON public.student_groups;
DROP POLICY IF EXISTS "Anyone can create student groups" ON public.student_groups;
DROP POLICY IF EXISTS "Anyone can update student groups" ON public.student_groups;
DROP POLICY IF EXISTS "Anyone can delete student groups" ON public.student_groups;

-- Temporary public access until auth is implemented
CREATE POLICY "Public read access to student groups" 
ON public.student_groups FOR SELECT USING (true);

CREATE POLICY "Public insert access to student groups" 
ON public.student_groups FOR INSERT WITH CHECK (true);

CREATE POLICY "Public update access to student groups" 
ON public.student_groups FOR UPDATE USING (true);

CREATE POLICY "Public delete access to student groups" 
ON public.student_groups FOR DELETE USING (true);