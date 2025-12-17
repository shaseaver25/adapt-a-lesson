-- Fix storage RLS policies - the folder structure is lessons/{lesson_id}/...
-- So we need [2] not [1] to get the lesson_id from the path

-- Drop the incorrect policies
DROP POLICY IF EXISTS "Users can read own lesson audio files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own lesson audio files" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own lesson audio" ON storage.objects;

-- Create corrected SELECT policy
CREATE POLICY "Users can read own lesson audio"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'lesson-audio' 
  AND (
    -- Check if the lesson belongs to the user (lesson_id is at position [2] after 'lessons/')
    EXISTS (
      SELECT 1 FROM generated_lessons gl
      WHERE gl.id::text = (storage.foldername(name))[2]
      AND gl.user_id = auth.uid()
    )
    OR auth.role() = 'service_role'
  )
);

-- Create corrected DELETE policy  
CREATE POLICY "Users can delete own lesson audio"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'lesson-audio'
  AND EXISTS (
    SELECT 1 FROM generated_lessons gl
    WHERE gl.id::text = (storage.foldername(name))[2]
    AND gl.user_id = auth.uid()
  )
);