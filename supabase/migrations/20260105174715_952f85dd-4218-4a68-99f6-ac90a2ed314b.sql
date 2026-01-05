-- Add session duration tracking columns to user_sessions
ALTER TABLE public.user_sessions 
ADD COLUMN IF NOT EXISTS session_started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS session_duration_seconds INTEGER DEFAULT 0;

-- Create user_time_stats table for aggregated time tracking
CREATE TABLE IF NOT EXISTS public.user_time_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  total_time_seconds INTEGER NOT NULL DEFAULT 0,
  last_session_duration_seconds INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on user_time_stats
ALTER TABLE public.user_time_stats ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_time_stats
CREATE POLICY "Users can read own time stats"
ON public.user_time_stats
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own time stats"
ON public.user_time_stats
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own time stats"
ON public.user_time_stats
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all time stats"
ON public.user_time_stats
FOR SELECT
USING (is_admin(auth.uid()));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_time_stats_user_id ON public.user_time_stats(user_id);

-- Function to update user time stats
CREATE OR REPLACE FUNCTION public.update_user_time_stats(
  p_user_id UUID,
  p_duration_seconds INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_time_stats (user_id, total_time_seconds, last_session_duration_seconds, last_updated)
  VALUES (p_user_id, p_duration_seconds, p_duration_seconds, now())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    total_time_seconds = user_time_stats.total_time_seconds + p_duration_seconds,
    last_session_duration_seconds = p_duration_seconds,
    last_updated = now();
END;
$$;