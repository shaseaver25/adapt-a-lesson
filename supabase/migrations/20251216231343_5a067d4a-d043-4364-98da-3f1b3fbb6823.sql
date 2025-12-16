-- Step 1: Revert bucket to private
UPDATE storage.buckets 
SET public = false 
WHERE name = 'lesson-audio';

-- Step 2: Drop any existing overly permissive policies
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Public can read lesson-audio" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read audio" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for lesson-audio" ON storage.objects;
DROP POLICY IF EXISTS "Users with roles can insert lesson audio" ON storage.objects;
DROP POLICY IF EXISTS "Service role can update lesson audio" ON storage.objects;
DROP POLICY IF EXISTS "Service role can delete lesson audio" ON storage.objects;

-- Step 3: Create proper storage policies

-- SERVICE ROLE: Full access for API integrations (ElevenLabs, etc.)
CREATE POLICY "Service role can manage lesson-audio"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'lesson-audio')
WITH CHECK (bucket_id = 'lesson-audio');

-- AUTHENTICATED USERS: Can read audio for lessons they own
CREATE POLICY "Users can read own lesson audio files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'lesson-audio'
  AND EXISTS (
    SELECT 1 FROM public.generated_lessons gl
    WHERE gl.id::text = (storage.foldername(name))[1]
    AND gl.user_id = auth.uid()
  )
);

-- AUTHENTICATED USERS: Can delete audio for lessons they own
CREATE POLICY "Users can delete own lesson audio files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'lesson-audio'
  AND EXISTS (
    SELECT 1 FROM public.generated_lessons gl
    WHERE gl.id::text = (storage.foldername(name))[1]
    AND gl.user_id = auth.uid()
  )
);