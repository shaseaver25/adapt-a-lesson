
CREATE TABLE public.marketing_surveys (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  primary_role text NOT NULL,
  grade_levels text[] DEFAULT '{}'::text[],
  usage_duration text,
  lessons_per_week text,
  features_used text[] DEFAULT '{}'::text[],
  time_saved_rating integer,
  previous_method text,
  lesson_quality_satisfaction integer,
  multilingual_satisfaction integer,
  student_impact text,
  nps_score integer,
  wcag_adoption_factor text,
  ocr_complaint text,
  most_valuable_thing text,
  improvement_suggestion text,
  incentive_claimed boolean DEFAULT false,
  incentive_claim_date timestamptz
);

ALTER TABLE public.marketing_surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own marketing surveys"
  ON public.marketing_surveys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own marketing surveys"
  ON public.marketing_surveys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all marketing surveys"
  ON public.marketing_surveys FOR SELECT
  USING (is_admin(auth.uid()));
