-- Add rubric_name column to generated_rubrics table
ALTER TABLE public.generated_rubrics
ADD COLUMN rubric_name text DEFAULT NULL;