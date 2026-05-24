CREATE POLICY "Users can insert own lesson audio status"
ON public.lesson_audio_status
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.generated_lessons gl
    WHERE gl.id = lesson_audio_status.lesson_id
      AND gl.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own lesson audio status"
ON public.lesson_audio_status
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.generated_lessons gl
    WHERE gl.id = lesson_audio_status.lesson_id
      AND gl.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.generated_lessons gl
    WHERE gl.id = lesson_audio_status.lesson_id
      AND gl.user_id = auth.uid()
  )
);