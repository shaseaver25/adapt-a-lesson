ALTER TABLE public.ai_cost_logs
  ADD COLUMN IF NOT EXISTS claude_estimated_cost numeric,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;