-- Add missing columns to generated_audio table
ALTER TABLE public.generated_audio 
ADD COLUMN IF NOT EXISTS storage_path TEXT,
ADD COLUMN IF NOT EXISTS voice_id TEXT DEFAULT 'default';

-- Audio generation status tracking table
CREATE TABLE IF NOT EXISTS public.lesson_audio_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.generated_lessons(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'generating', 'complete', 'partial', 'failed')),
  total_sections INTEGER NOT NULL DEFAULT 0,
  completed_sections INTEGER DEFAULT 0,
  failed_sections INTEGER DEFAULT 0,
  error_details JSONB DEFAULT '[]'::jsonb,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(lesson_id)
);

-- Vocabulary audio (bilingual - term + definition in both languages)
CREATE TABLE IF NOT EXISTS public.vocabulary_audio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.generated_lessons(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.student_groups(id),
  group_name TEXT NOT NULL,
  vocab_id TEXT NOT NULL,
  term TEXT NOT NULL,
  definition TEXT,
  
  -- English audio
  english_term_audio_url TEXT,
  english_definition_audio_url TEXT,
  
  -- Home language audio
  home_language TEXT DEFAULT 'English',
  translated_term TEXT,
  translated_definition TEXT,
  home_language_term_audio_url TEXT,
  home_language_definition_audio_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(lesson_id, group_name, vocab_id)
);

-- Enable RLS
ALTER TABLE public.lesson_audio_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabulary_audio ENABLE ROW LEVEL SECURITY;

-- RLS policies for lesson_audio_status
CREATE POLICY "Anyone can read lesson audio status" ON public.lesson_audio_status
FOR SELECT USING (true);

CREATE POLICY "Anyone can insert lesson audio status" ON public.lesson_audio_status
FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update lesson audio status" ON public.lesson_audio_status
FOR UPDATE USING (true);

-- RLS policies for vocabulary_audio
CREATE POLICY "Anyone can read vocabulary audio" ON public.vocabulary_audio
FOR SELECT USING (true);

CREATE POLICY "Anyone can insert vocabulary audio" ON public.vocabulary_audio
FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update vocabulary audio" ON public.vocabulary_audio
FOR UPDATE USING (true);

-- Index for fast retrieval
CREATE INDEX IF NOT EXISTS idx_lesson_audio_status_lesson 
ON public.lesson_audio_status (lesson_id);

CREATE INDEX IF NOT EXISTS idx_vocabulary_audio_lookup 
ON public.vocabulary_audio (lesson_id, group_name);

-- Trigger function to update audio status count
CREATE OR REPLACE FUNCTION public.update_audio_status_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.lesson_audio_status
  SET 
    completed_sections = (
      SELECT COUNT(*) FROM public.generated_audio 
      WHERE lesson_id = NEW.lesson_id
    ),
    updated_at = NOW(),
    status = CASE 
      WHEN completed_sections >= total_sections THEN 'complete'
      WHEN completed_sections > 0 THEN 'partial'
      ELSE status
    END
  WHERE lesson_id = NEW.lesson_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger on generated_audio
DROP TRIGGER IF EXISTS on_generated_audio_insert ON public.generated_audio;
CREATE TRIGGER on_generated_audio_insert
AFTER INSERT ON public.generated_audio
FOR EACH ROW
EXECUTE FUNCTION public.update_audio_status_count();