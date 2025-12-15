-- Track bilingual document generation
CREATE TABLE public.bilingual_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.generated_lessons(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.student_groups(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL CHECK (section_type IN ('independent-practice', 'exit-ticket', 'assessment', 'learning-target', 'vocabulary', 'content')),
  home_language TEXT NOT NULL,
  document_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  orientation TEXT DEFAULT 'landscape',
  
  -- QR codes stored for reference
  qr_codes JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Alignment data for debugging/regeneration
  alignment_data JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(lesson_id, group_id, section_type)
);

-- Index for quick retrieval
CREATE INDEX idx_bilingual_docs_lookup ON public.bilingual_documents (lesson_id, group_id);
CREATE INDEX idx_bilingual_docs_section ON public.bilingual_documents (lesson_id, section_type);

-- Enable RLS
ALTER TABLE public.bilingual_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for public access (matching existing pattern)
CREATE POLICY "Anyone can read bilingual documents"
ON public.bilingual_documents FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert bilingual documents"
ON public.bilingual_documents FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update bilingual documents"
ON public.bilingual_documents FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete bilingual documents"
ON public.bilingual_documents FOR DELETE
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_bilingual_documents_updated_at
  BEFORE UPDATE ON public.bilingual_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();