-- Create class folders table
CREATE TABLE public.class_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_name TEXT NOT NULL,
  color TEXT DEFAULT 'blue',
  user_id UUID,
  organization_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add folder_id to student_groups
ALTER TABLE public.student_groups 
ADD COLUMN folder_id UUID REFERENCES public.class_folders(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.class_folders ENABLE ROW LEVEL SECURITY;

-- RLS policies for class_folders (public access for now since no auth)
CREATE POLICY "Allow all access to class_folders" ON public.class_folders
  FOR ALL USING (true) WITH CHECK (true);

-- Index for efficient queries
CREATE INDEX idx_student_groups_folder_id ON public.student_groups(folder_id);