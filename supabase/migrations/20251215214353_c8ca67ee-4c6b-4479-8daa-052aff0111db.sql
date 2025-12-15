-- Add unique constraint for audio upsert operations
ALTER TABLE public.generated_audio 
ADD CONSTRAINT generated_audio_unique_section 
UNIQUE (lesson_id, group_name, section_id);

-- Add index for faster lookups by lesson
CREATE INDEX IF NOT EXISTS idx_generated_audio_lesson_id ON public.generated_audio(lesson_id);

-- Add index for audio_cache lookups
CREATE INDEX IF NOT EXISTS idx_audio_cache_phrase_hash ON public.audio_cache(phrase_hash, language, voice_id);