
-- Create page_views table for tracking real page views
CREATE TABLE public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  page_path text NOT NULL,
  referrer text,
  user_agent text,
  session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add index for common queries
CREATE INDEX idx_page_views_created_at ON public.page_views(created_at);
CREATE INDEX idx_page_views_user_id ON public.page_views(user_id);
CREATE INDEX idx_page_views_session_id ON public.page_views(session_id);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Users can insert their own page views
CREATE POLICY "Users can insert own page views"
  ON public.page_views FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can read all page views
CREATE POLICY "Admins can view all page views"
  ON public.page_views FOR SELECT
  USING (is_admin(auth.uid()));
