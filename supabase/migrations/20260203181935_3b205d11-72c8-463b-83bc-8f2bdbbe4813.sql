-- Create compliance_events table for PII detection logging
-- CRITICAL: Never stores actual PII text, only event metadata

CREATE TABLE public.compliance_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NULL,
  field_name TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  findings TEXT[] NOT NULL DEFAULT '{}',
  match_count INTEGER NOT NULL DEFAULT 0,
  action_taken TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Validate event_type values
  CONSTRAINT valid_event_type CHECK (event_type IN ('PII_WARNING_TRIGGERED', 'PII_OVERRIDE_USED')),
  
  -- Validate entity_type values
  CONSTRAINT valid_entity_type CHECK (entity_type IN ('student_group', 'lesson', 'assessment', 'rubric')),
  
  -- Validate risk_level values
  CONSTRAINT valid_risk_level CHECK (risk_level IN ('low', 'medium', 'high')),
  
  -- Validate action_taken values
  CONSTRAINT valid_action_taken CHECK (action_taken IS NULL OR action_taken IN ('blocked', 'edited', 'override_allowed'))
);

-- Add table comment
COMMENT ON TABLE public.compliance_events IS 'Logs PII detection events for FERPA compliance. Never stores actual PII text.';

-- Enable Row Level Security
ALTER TABLE public.compliance_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can insert their own compliance events
CREATE POLICY "Users can insert own compliance events"
ON public.compliance_events
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own compliance events
CREATE POLICY "Users can view own compliance events"
ON public.compliance_events
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all compliance events (uses existing is_admin function)
CREATE POLICY "Admins can view all compliance events"
ON public.compliance_events
FOR SELECT
USING (is_admin(auth.uid()));

-- No UPDATE or DELETE policies - events are immutable audit records

-- Indexes for efficient querying
CREATE INDEX idx_compliance_events_user_id ON public.compliance_events(user_id);
CREATE INDEX idx_compliance_events_event_type ON public.compliance_events(event_type);
CREATE INDEX idx_compliance_events_created_at ON public.compliance_events(created_at DESC);