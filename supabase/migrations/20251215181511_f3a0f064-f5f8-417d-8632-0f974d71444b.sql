-- Create generated_rubrics table with AI-proof metadata
CREATE TABLE public.generated_rubrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  assessment_description TEXT NOT NULL,
  learning_objectives TEXT[] NOT NULL,
  rubric_content TEXT NOT NULL,
  num_criteria INTEGER NOT NULL DEFAULT 4,
  grade_level TEXT,
  ai_vulnerability_score INTEGER,
  ai_proof_criteria JSONB,
  verification_checkpoints TEXT[],
  ai_proof_settings JSONB,
  auto_verification_added BOOLEAN DEFAULT false,
  auto_verification_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.generated_rubrics ENABLE ROW LEVEL SECURITY;

-- Public access policies (no auth required for now)
CREATE POLICY "Public read access to generated rubrics"
ON public.generated_rubrics
FOR SELECT
USING (true);

CREATE POLICY "Public insert access to generated rubrics"
ON public.generated_rubrics
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public update access to generated rubrics"
ON public.generated_rubrics
FOR UPDATE
USING (true);

CREATE POLICY "Public delete access to generated rubrics"
ON public.generated_rubrics
FOR DELETE
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_generated_rubrics_updated_at
BEFORE UPDATE ON public.generated_rubrics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create rubric_verifications table for tracking verification outcomes
CREATE TABLE public.rubric_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rubric_id UUID REFERENCES public.generated_rubrics(id) ON DELETE CASCADE,
  student_id UUID,
  student_name TEXT,
  verification_type TEXT NOT NULL, -- 'process_doc', 'live_qa', 'artifact', 'peer_verification', 'draft_history'
  verification_passed BOOLEAN,
  score INTEGER, -- Optional score 1-4 for rubric level
  notes TEXT,
  red_flags_detected TEXT[],
  verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rubric_verifications ENABLE ROW LEVEL SECURITY;

-- Public access policies
CREATE POLICY "Public read access to rubric verifications"
ON public.rubric_verifications
FOR SELECT
USING (true);

CREATE POLICY "Public insert access to rubric verifications"
ON public.rubric_verifications
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public update access to rubric verifications"
ON public.rubric_verifications
FOR UPDATE
USING (true);

CREATE POLICY "Public delete access to rubric verifications"
ON public.rubric_verifications
FOR DELETE
USING (true);

-- Add index for faster lookups
CREATE INDEX idx_rubric_verifications_rubric_id ON public.rubric_verifications(rubric_id);
CREATE INDEX idx_rubric_verifications_student_id ON public.rubric_verifications(student_id);
CREATE INDEX idx_generated_rubrics_user_id ON public.generated_rubrics(user_id);