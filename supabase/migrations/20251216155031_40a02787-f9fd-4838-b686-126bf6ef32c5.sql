-- Create sessions table for device tracking
CREATE TABLE public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  device_info text,
  ip_address text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  last_active_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, session_id)
);

-- Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can read their own sessions
CREATE POLICY "Users can read own sessions"
ON public.user_sessions
FOR SELECT
USING (user_id = auth.uid());

-- Users can insert their own sessions
CREATE POLICY "Users can insert own sessions"
ON public.user_sessions
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can update their own sessions
CREATE POLICY "Users can update own sessions"
ON public.user_sessions
FOR UPDATE
USING (user_id = auth.uid());

-- Users can delete their own sessions
CREATE POLICY "Users can delete own sessions"
ON public.user_sessions
FOR DELETE
USING (user_id = auth.uid());

-- Function to count active sessions (within 12 hours)
CREATE OR REPLACE FUNCTION public.count_active_sessions(p_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM public.user_sessions
  WHERE user_id = p_user_id
    AND last_active_at > now() - interval '12 hours'
$$;

-- Function to cleanup inactive sessions (older than 12 hours)
CREATE OR REPLACE FUNCTION public.cleanup_inactive_sessions(p_user_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.user_sessions
  WHERE user_id = p_user_id
    AND last_active_at < now() - interval '12 hours'
$$;

-- Index for faster lookups
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_last_active ON public.user_sessions(last_active_at);