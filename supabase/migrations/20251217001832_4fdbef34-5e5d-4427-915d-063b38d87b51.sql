-- Create lesson_images table to track generated images
CREATE TABLE public.lesson_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.generated_lessons(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.student_groups(id) ON DELETE SET NULL,
  storage_path TEXT NOT NULL,
  description TEXT,
  alt_text TEXT,
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lesson_images ENABLE ROW LEVEL SECURITY;

-- Users can read images for lessons they own
CREATE POLICY "Users can read own lesson images"
ON public.lesson_images FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.generated_lessons gl
  WHERE gl.id = lesson_images.lesson_id
  AND gl.user_id = auth.uid()
));

-- Service role can manage all lesson images (for edge functions)
CREATE POLICY "Service role can manage lesson images"
ON public.lesson_images FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Create index for faster lookups
CREATE INDEX idx_lesson_images_lesson_id ON public.lesson_images(lesson_id);