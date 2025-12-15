-- Add generated_lessons table for caching differentiated lessons
CREATE TABLE public.generated_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  original_content TEXT NOT NULL,
  lesson_title TEXT,
  group_ids UUID[] NOT NULL,
  teacher_guide TEXT,
  student_handouts JSONB,
  differentiation_options JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add index for faster lookups by user
CREATE INDEX idx_generated_lessons_user_id ON public.generated_lessons(user_id);

-- Enable RLS
ALTER TABLE public.generated_lessons ENABLE ROW LEVEL SECURITY;

-- Public access policies (since no auth is implemented yet)
CREATE POLICY "Public read access to generated lessons"
ON public.generated_lessons
FOR SELECT
USING (true);

CREATE POLICY "Public insert access to generated lessons"
ON public.generated_lessons
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public update access to generated lessons"
ON public.generated_lessons
FOR UPDATE
USING (true);

CREATE POLICY "Public delete access to generated lessons"
ON public.generated_lessons
FOR DELETE
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_generated_lessons_updated_at
BEFORE UPDATE ON public.generated_lessons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();