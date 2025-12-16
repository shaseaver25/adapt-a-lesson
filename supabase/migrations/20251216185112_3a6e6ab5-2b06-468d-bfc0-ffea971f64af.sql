-- Fix 1: lesson_audio_status - restrict to lesson owners and service role
DROP POLICY IF EXISTS "Anyone can read lesson audio status" ON public.lesson_audio_status;
DROP POLICY IF EXISTS "Anyone can insert lesson audio status" ON public.lesson_audio_status;
DROP POLICY IF EXISTS "Anyone can update lesson audio status" ON public.lesson_audio_status;

-- Users can read audio status for their own lessons
CREATE POLICY "Users can read own lesson audio status"
ON public.lesson_audio_status
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.generated_lessons gl
    WHERE gl.id = lesson_audio_status.lesson_id
    AND gl.user_id = auth.uid()
  )
);

-- Service role can insert lesson audio status (edge functions)
CREATE POLICY "Service role can insert lesson audio status"
ON public.lesson_audio_status
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- Service role can update lesson audio status
CREATE POLICY "Service role can update lesson audio status"
ON public.lesson_audio_status
FOR UPDATE
USING (auth.role() = 'service_role');

-- Fix 2: Make lesson-audio bucket private
UPDATE storage.buckets
SET public = false
WHERE id = 'lesson-audio';

-- Drop existing overly permissive storage policies if they exist
DROP POLICY IF EXISTS "Public read access for lesson audio" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload lesson audio" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read lesson audio" ON storage.objects;

-- Users can read their own lesson audio files
CREATE POLICY "Users can read own lesson audio"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'lesson-audio'
  AND (
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.generated_lessons
      WHERE user_id = auth.uid()
    )
    OR auth.role() = 'service_role'
  )
);

-- Service role can manage all lesson audio
CREATE POLICY "Service role can insert lesson audio"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'lesson-audio' AND auth.role() = 'service_role');

CREATE POLICY "Service role can update lesson audio"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'lesson-audio' AND auth.role() = 'service_role');

CREATE POLICY "Service role can delete lesson audio"
ON storage.objects
FOR DELETE
USING (bucket_id = 'lesson-audio' AND auth.role() = 'service_role');

-- Fix 3: Add missing DELETE policy for vocabulary_audio
CREATE POLICY "Service role can delete vocabulary audio"
ON public.vocabulary_audio
FOR DELETE
USING (auth.role() = 'service_role');

-- Also allow lesson owners to delete their vocabulary audio
CREATE POLICY "Users can delete own vocabulary audio"
ON public.vocabulary_audio
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.generated_lessons gl
    WHERE gl.id = vocabulary_audio.lesson_id
    AND gl.user_id = auth.uid()
  )
);