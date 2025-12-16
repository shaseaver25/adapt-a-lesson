-- FIX 1: Secure generated_audio table (restrict to lesson owners + service role)
DROP POLICY IF EXISTS "Anyone can read generated audio" ON public.generated_audio;
DROP POLICY IF EXISTS "Anyone can insert generated audio" ON public.generated_audio;
DROP POLICY IF EXISTS "Anyone can update generated audio" ON public.generated_audio;

-- Users can only read audio for their own lessons
CREATE POLICY "Users can read own lesson audio"
ON public.generated_audio
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.generated_lessons gl
    WHERE gl.id = generated_audio.lesson_id
    AND gl.user_id = auth.uid()
  )
);

-- Service role can manage all audio (for edge functions)
CREATE POLICY "Service role can manage generated audio"
ON public.generated_audio
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

ALTER TABLE public.generated_audio FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.generated_audio FROM anon;

-- FIX 2: Secure audio_cache table (service role only for writes, public read OK for cache)
DROP POLICY IF EXISTS "Anyone can insert audio cache" ON public.audio_cache;
DROP POLICY IF EXISTS "Anyone can update audio cache" ON public.audio_cache;

-- Service role only for cache writes
CREATE POLICY "Service role can insert audio cache"
ON public.audio_cache
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update audio cache"
ON public.audio_cache
FOR UPDATE
USING (auth.role() = 'service_role');

ALTER TABLE public.audio_cache FORCE ROW LEVEL SECURITY;

-- FIX 3: Secure audio_usage table (restrict to authenticated users + service role)
DROP POLICY IF EXISTS "Anyone can insert audio usage" ON public.audio_usage;
DROP POLICY IF EXISTS "Anyone can read audio usage" ON public.audio_usage;

-- Service role can insert usage records
CREATE POLICY "Service role can insert audio usage"
ON public.audio_usage
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- Authenticated users can read usage for their own lessons
CREATE POLICY "Users can read own audio usage"
ON public.audio_usage
FOR SELECT
TO authenticated
USING (
  lesson_id IS NULL OR
  EXISTS (
    SELECT 1 FROM public.generated_lessons gl
    WHERE gl.id = audio_usage.lesson_id
    AND gl.user_id = auth.uid()
  )
);

ALTER TABLE public.audio_usage FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.audio_usage FROM anon;