-- realpath-lms: schema for Canvas OAuth connections + transient state

CREATE TABLE IF NOT EXISTS public.canvas_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  canvas_instance_url TEXT NOT NULL,
  canvas_user_id BIGINT,
  encrypted_access_token TEXT NOT NULL,
  encrypted_refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  scope TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, canvas_instance_url)
);

CREATE INDEX IF NOT EXISTS canvas_connections_user_idx
  ON public.canvas_connections (user_id);

CREATE TABLE IF NOT EXISTS public.canvas_oauth_state (
  state TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  canvas_instance_url TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS canvas_oauth_state_expires_idx
  ON public.canvas_oauth_state (expires_at);

ALTER TABLE public.canvas_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canvas_oauth_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "canvas_connections_owner_only"
  ON public.canvas_connections
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "canvas_oauth_state_owner_only"
  ON public.canvas_oauth_state
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);