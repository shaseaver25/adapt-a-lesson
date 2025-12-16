-- Fix vocabulary_audio: restrict to service_role for INSERT/UPDATE, authenticated for SELECT via lesson ownership
DROP POLICY IF EXISTS "Anyone can read vocabulary audio" ON public.vocabulary_audio;
DROP POLICY IF EXISTS "Anyone can insert vocabulary audio" ON public.vocabulary_audio;
DROP POLICY IF EXISTS "Anyone can update vocabulary audio" ON public.vocabulary_audio;

-- Allow authenticated users to read vocabulary audio for their own lessons
CREATE POLICY "Users can read vocabulary audio for own lessons"
ON public.vocabulary_audio
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.generated_lessons gl
    WHERE gl.id = vocabulary_audio.lesson_id
    AND gl.user_id = auth.uid()
  )
);

-- Service role can insert vocabulary audio (edge functions use service role)
CREATE POLICY "Service role can insert vocabulary audio"
ON public.vocabulary_audio
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- Service role can update vocabulary audio
CREATE POLICY "Service role can update vocabulary audio"
ON public.vocabulary_audio
FOR UPDATE
USING (auth.role() = 'service_role');

-- Fix error_logs: restrict INSERT to authenticated users only
DROP POLICY IF EXISTS "Anyone can insert errors" ON public.error_logs;

-- Only authenticated users can insert errors
CREATE POLICY "Authenticated users can insert errors"
ON public.error_logs
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);