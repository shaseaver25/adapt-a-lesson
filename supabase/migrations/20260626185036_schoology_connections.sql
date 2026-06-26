-- Schema for Schoology API connections (two-legged OAuth 1.0a).
--
-- Unlike Canvas, Schoology is a single centralized host (api.schoology.com), so
-- there is no per-instance dimension — one connection per teacher. We store the
-- teacher's OAuth 1.0a consumer key/secret (encrypted with the same scheme as
-- canvas tokens). The token columns are reserved for a future three-legged flow.

CREATE TABLE IF NOT EXISTS public.schoology_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  schoology_user_id TEXT,
  encrypted_consumer_key TEXT NOT NULL,
  encrypted_consumer_secret TEXT NOT NULL,
  -- Reserved for three-legged OAuth (null on the two-legged path).
  encrypted_token TEXT,
  encrypted_token_secret TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS schoology_connections_user_idx
  ON public.schoology_connections (user_id);

ALTER TABLE public.schoology_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "schoology_connections_owner_only"
  ON public.schoology_connections
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
