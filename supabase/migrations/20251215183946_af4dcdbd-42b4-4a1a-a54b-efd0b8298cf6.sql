-- Create saved_assessments table for storing reusable assessment descriptions
CREATE TABLE public.saved_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NULL,
  title TEXT NOT NULL,
  assessment_description TEXT NOT NULL,
  grade_level TEXT NULL,
  subject TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_assessments ENABLE ROW LEVEL SECURITY;

-- Create public access policies (matching existing pattern)
CREATE POLICY "Public read access to saved assessments"
ON public.saved_assessments
FOR SELECT
USING (true);

CREATE POLICY "Public insert access to saved assessments"
ON public.saved_assessments
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public update access to saved assessments"
ON public.saved_assessments
FOR UPDATE
USING (true);

CREATE POLICY "Public delete access to saved assessments"
ON public.saved_assessments
FOR DELETE
USING (true);

-- Add trigger for updating updated_at
CREATE TRIGGER update_saved_assessments_updated_at
BEFORE UPDATE ON public.saved_assessments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();