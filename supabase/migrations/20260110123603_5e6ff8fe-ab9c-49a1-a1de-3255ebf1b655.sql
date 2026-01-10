-- User Feedback Table
CREATE TABLE public.user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  -- Usage Metrics
  usage_frequency TEXT NOT NULL CHECK (usage_frequency IN ('daily', 'weekly', 'monthly', 'rarely')),
  
  -- Feature Ratings (1-5 scale)
  overall_satisfaction INTEGER CHECK (overall_satisfaction BETWEEN 1 AND 5),
  ease_of_use INTEGER CHECK (ease_of_use BETWEEN 1 AND 5),
  feature_completeness INTEGER CHECK (feature_completeness BETWEEN 1 AND 5),
  
  -- Open-Ended Feedback
  favorite_features TEXT,
  pain_points TEXT,
  missing_features TEXT,
  improvement_suggestions TEXT,
  
  -- Recommendation
  would_recommend BOOLEAN,
  recommendation_reason TEXT,
  
  -- User Context
  user_role TEXT CHECK (user_role IN ('teacher', 'administrator', 'coach', 'other')),
  years_teaching INTEGER,
  grade_levels TEXT[],
  subject_areas TEXT[],
  
  -- Additional Context
  use_cases TEXT,
  success_stories TEXT,
  comparison_to_other_tools TEXT,
  
  -- Metadata
  feedback_type TEXT DEFAULT 'general' CHECK (feedback_type IN ('general', 'incentive_campaign', 'bug_report', 'feature_request')),
  incentive_claimed BOOLEAN DEFAULT false,
  incentive_claim_date TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_user_feedback_user_id ON public.user_feedback(user_id);
CREATE INDEX idx_user_feedback_created_at ON public.user_feedback(created_at DESC);
CREATE INDEX idx_user_feedback_satisfaction ON public.user_feedback(overall_satisfaction);
CREATE INDEX idx_user_feedback_recommend ON public.user_feedback(would_recommend);

-- Enable RLS
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

-- Users can insert their own feedback
CREATE POLICY "Users can create their own feedback"
  ON public.user_feedback
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own feedback
CREATE POLICY "Users can view their own feedback"
  ON public.user_feedback
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all feedback
CREATE POLICY "Admins can view all feedback"
  ON public.user_feedback
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_user_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_feedback_updated_at
  BEFORE UPDATE ON public.user_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_feedback_updated_at();