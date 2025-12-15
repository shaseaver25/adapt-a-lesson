-- Create student_groups table
CREATE TABLE public.student_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_name TEXT NOT NULL,
  num_students INTEGER NOT NULL DEFAULT 1,
  reading_level_label TEXT NOT NULL DEFAULT 'On Grade',
  reading_level_lexile TEXT,
  home_language TEXT NOT NULL DEFAULT 'English',
  ell_status TEXT NOT NULL DEFAULT 'None',
  iep_504_status TEXT NOT NULL DEFAULT 'None',
  learning_preferences TEXT[] DEFAULT '{}',
  accommodations TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_groups ENABLE ROW LEVEL SECURITY;

-- Allow public access (no auth required for now)
CREATE POLICY "Anyone can view student groups" 
ON public.student_groups FOR SELECT USING (true);

CREATE POLICY "Anyone can create student groups" 
ON public.student_groups FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update student groups" 
ON public.student_groups FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete student groups" 
ON public.student_groups FOR DELETE USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_student_groups_updated_at
BEFORE UPDATE ON public.student_groups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();