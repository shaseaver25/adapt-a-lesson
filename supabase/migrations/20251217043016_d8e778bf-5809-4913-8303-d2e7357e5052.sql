-- Create table for generated assessments with full context
CREATE TABLE public.generated_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  assessment_content TEXT NOT NULL,
  lesson_title TEXT,
  subject TEXT,
  grade_level TEXT,
  learning_objectives TEXT[],
  method_category TEXT,
  method_name TEXT,
  method_outputs JSONB,
  school_name TEXT,
  city TEXT,
  state TEXT,
  local_context_details TEXT,
  storage_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.generated_assessments ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own assessments"
ON public.generated_assessments
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assessments"
ON public.generated_assessments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assessments"
ON public.generated_assessments
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own assessments"
ON public.generated_assessments
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_generated_assessments_updated_at
BEFORE UPDATE ON public.generated_assessments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for assessments
INSERT INTO storage.buckets (id, name, public)
VALUES ('assessments', 'assessments', false);

-- Storage policies for assessments bucket
CREATE POLICY "Users can read own assessment files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'assessments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own assessment files"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'assessments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own assessment files"
ON storage.objects
FOR DELETE
USING (bucket_id = 'assessments' AND auth.uid()::text = (storage.foldername(name))[1]);