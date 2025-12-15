-- Create storage bucket for lesson audio
INSERT INTO storage.buckets (id, name, public)
VALUES ('lesson-audio', 'lesson-audio', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policy for public read access
CREATE POLICY "Public read access for lesson audio"
ON storage.objects FOR SELECT
USING (bucket_id = 'lesson-audio');

-- Create RLS policy for authenticated upload
CREATE POLICY "Anyone can upload lesson audio"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'lesson-audio');

-- Create audio usage tracking table for cost monitoring
CREATE TABLE public.audio_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID REFERENCES public.generated_lessons(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.student_groups(id) ON DELETE SET NULL,
  section_type TEXT NOT NULL,
  characters_used INTEGER NOT NULL DEFAULT 0,
  estimated_cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
  language TEXT NOT NULL DEFAULT 'English',
  audio_url TEXT,
  duration_seconds DECIMAL(8, 2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on audio_usage
ALTER TABLE public.audio_usage ENABLE ROW LEVEL SECURITY;

-- Allow public insert for tracking (no auth required for this app)
CREATE POLICY "Anyone can insert audio usage"
ON public.audio_usage FOR INSERT
WITH CHECK (true);

-- Allow public read for usage reporting
CREATE POLICY "Anyone can read audio usage"
ON public.audio_usage FOR SELECT
USING (true);

-- Create generated_audio table to cache audio for lessons
CREATE TABLE public.generated_audio (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID REFERENCES public.generated_lessons(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.student_groups(id) ON DELETE SET NULL,
  group_name TEXT NOT NULL,
  section_type TEXT NOT NULL,
  section_id TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  duration_seconds DECIMAL(8, 2),
  language TEXT NOT NULL DEFAULT 'English',
  characters_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(lesson_id, group_name, section_id)
);

-- Enable RLS on generated_audio
ALTER TABLE public.generated_audio ENABLE ROW LEVEL SECURITY;

-- Allow public access to generated audio
CREATE POLICY "Anyone can insert generated audio"
ON public.generated_audio FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can read generated audio"
ON public.generated_audio FOR SELECT
USING (true);

CREATE POLICY "Anyone can update generated audio"
ON public.generated_audio FOR UPDATE
USING (true);