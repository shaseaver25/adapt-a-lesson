-- Cached common phrases to reduce API calls
CREATE TABLE public.audio_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phrase_hash TEXT UNIQUE NOT NULL,
  phrase_text TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'English',
  voice_id TEXT NOT NULL DEFAULT 'default',
  audio_url TEXT NOT NULL,
  character_count INTEGER NOT NULL DEFAULT 0,
  usage_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.audio_cache ENABLE ROW LEVEL SECURITY;

-- Public read/write access for cache
CREATE POLICY "Anyone can read audio cache" ON public.audio_cache FOR SELECT USING (true);
CREATE POLICY "Anyone can insert audio cache" ON public.audio_cache FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update audio cache" ON public.audio_cache FOR UPDATE USING (true);

-- Index for monthly aggregation on audio_usage
CREATE INDEX IF NOT EXISTS idx_audio_usage_monthly ON public.audio_usage (created_at);

-- Index for cache lookups
CREATE INDEX idx_audio_cache_hash ON public.audio_cache (phrase_hash);