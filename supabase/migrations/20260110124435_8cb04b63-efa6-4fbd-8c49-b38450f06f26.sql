-- Help Articles (Knowledge Base)
CREATE TABLE help_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Content
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  
  -- Organization
  category TEXT NOT NULL CHECK (category IN (
    'getting-started',
    'account-settings',
    'courses',
    'events',
    'payments',
    'technical-issues',
    'features',
    'other'
  )),
  tags TEXT[],
  
  -- Metadata
  is_published BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  search_keywords TEXT,
  
  -- Ordering
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

-- Support Tickets
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT UNIQUE NOT NULL,
  
  -- User Info
  user_id UUID,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  
  -- Issue Details
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'bug-report',
    'feature-request',
    'account-issue',
    'payment-issue',
    'technical-problem',
    'content-question',
    'other'
  )),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- Status Tracking
  status TEXT DEFAULT 'open' CHECK (status IN (
    'open',
    'in-progress',
    'waiting-on-user',
    'resolved',
    'closed'
  )),
  
  -- Assignment
  assigned_to UUID,
  
  -- Additional Context
  browser_info TEXT,
  page_url TEXT,
  screenshots TEXT[],
  error_messages TEXT,
  
  -- Resolution
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_user_reply_at TIMESTAMPTZ,
  last_admin_reply_at TIMESTAMPTZ
);

-- Support Ticket Replies
CREATE TABLE support_ticket_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
  
  -- Reply Content
  message TEXT NOT NULL,
  is_internal_note BOOLEAN DEFAULT false,
  
  -- Author Info
  author_id UUID,
  author_name TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  
  -- Attachments
  attachments TEXT[],
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Help Article Feedback
CREATE TABLE help_article_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES help_articles(id) ON DELETE CASCADE,
  user_id UUID,
  is_helpful BOOLEAN NOT NULL,
  feedback_comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(article_id, user_id)
);

-- Indexes for Performance
CREATE INDEX idx_help_articles_category ON help_articles(category);
CREATE INDEX idx_help_articles_published ON help_articles(is_published);
CREATE INDEX idx_help_articles_slug ON help_articles(slug);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_created ON support_tickets(created_at DESC);
CREATE INDEX idx_support_ticket_replies_ticket ON support_ticket_replies(ticket_id);

-- Full Text Search Index
CREATE INDEX idx_help_articles_search ON help_articles 
  USING gin(to_tsvector('english', title || ' ' || content || ' ' || COALESCE(search_keywords, '')));

-- RLS Policies for Help Articles
ALTER TABLE help_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published help articles"
  ON help_articles
  FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can manage help articles"
  ON help_articles
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- RLS Policies for Support Tickets
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tickets"
  ON support_tickets
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create tickets"
  ON support_tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all tickets"
  ON support_tickets
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update tickets"
  ON support_tickets
  FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()));

-- RLS Policies for Ticket Replies
ALTER TABLE support_ticket_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view replies on their tickets"
  ON support_ticket_replies
  FOR SELECT
  TO authenticated
  USING (
    is_internal_note = false AND
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE support_tickets.id = ticket_id
      AND support_tickets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can reply to their tickets"
  ON support_ticket_replies
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE support_tickets.id = ticket_id
      AND support_tickets.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all replies"
  ON support_ticket_replies
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can create replies"
  ON support_ticket_replies
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

-- RLS for Article Feedback
ALTER TABLE help_article_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can submit article feedback"
  ON help_article_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own feedback"
  ON help_article_feedback
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all article feedback"
  ON help_article_feedback
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- Functions
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  date_part TEXT;
  count_part TEXT;
BEGIN
  date_part := TO_CHAR(NOW(), 'YYYYMMDD');
  
  SELECT LPAD((COUNT(*) + 1)::TEXT, 3, '0')
  INTO count_part
  FROM support_tickets
  WHERE ticket_number LIKE 'TICKET-' || date_part || '%';
  
  new_number := 'TICKET-' || date_part || '-' || count_part;
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION update_help_article_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER help_articles_updated_at
  BEFORE UPDATE ON help_articles
  FOR EACH ROW
  EXECUTE FUNCTION update_help_article_updated_at();

CREATE OR REPLACE FUNCTION update_support_ticket_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_support_ticket_updated_at();