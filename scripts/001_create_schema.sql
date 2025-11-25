-- Anonymous Feedback System Schema
-- Drizzle ORM compatible with RLS policies

-- Categories table (configurable by admin)
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6b7280',
  icon TEXT DEFAULT 'folder',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tags table (configurable by admin)
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#3b82f6',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Questions table (configurable form questions)
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_type TEXT NOT NULL CHECK (question_type IN ('rating', 'multiple_choice', 'text', 'textarea')),
  question_text TEXT NOT NULL,
  description TEXT,
  options JSONB, -- For multiple choice: [{value: 'a', label: 'Option A'}]
  is_required BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  min_value INTEGER, -- For rating questions
  max_value INTEGER, -- For rating questions
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Branding settings table
CREATE TABLE IF NOT EXISTS branding_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_name TEXT DEFAULT 'Anonymous Feedback Portal',
  site_description TEXT DEFAULT 'Share your thoughts openly and honestly.',
  logo_url TEXT,
  primary_color TEXT DEFAULT '#10b981',
  secondary_color TEXT DEFAULT '#6366f1',
  accent_color TEXT DEFAULT '#f59e0b',
  trust_badge_1_title TEXT DEFAULT 'End-to-End Encryption',
  trust_badge_1_description TEXT DEFAULT 'Your feedback is encrypted before transmission',
  trust_badge_2_title TEXT DEFAULT 'No IP Tracking',
  trust_badge_2_description TEXT DEFAULT 'We strip all identifying metadata',
  trust_badge_3_title TEXT DEFAULT 'Anonymous Follow-ups',
  trust_badge_3_description TEXT DEFAULT 'Communicate without revealing identity',
  custom_css TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Notification settings table
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type TEXT NOT NULL UNIQUE CHECK (notification_type IN ('email', 'slack', 'telegram', 'webhook')),
  is_enabled BOOLEAN DEFAULT false,
  config JSONB NOT NULL DEFAULT '{}',
  -- Email: {email: string}
  -- Slack: {webhook_url: string}
  -- Telegram: {bot_token: string, chat_id: string}
  -- Webhook: {url: string, secret: string}
  notify_on_new_feedback BOOLEAN DEFAULT true,
  notify_on_urgent BOOLEAN DEFAULT true,
  notify_on_clarification_response BOOLEAN DEFAULT true,
  notify_daily_digest BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Main feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  access_code_hash TEXT NOT NULL UNIQUE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('suggestion', 'concern', 'praise', 'question')),
  urgency TEXT NOT NULL DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  impact TEXT,
  suggested_solution TEXT,
  allow_follow_up BOOLEAN DEFAULT true,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'in-progress', 'resolved')),
  moderation_status TEXT NOT NULL DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'flagged', 'rejected')),
  moderation_flags TEXT[] DEFAULT '{}',
  moderation_score INTEGER DEFAULT 100,
  keywords TEXT[] DEFAULT '{}',
  -- AI-generated categorization
  ai_category_suggestion TEXT,
  ai_urgency_suggestion TEXT,
  ai_summary TEXT,
  ai_sentiment TEXT CHECK (ai_sentiment IN ('positive', 'neutral', 'negative', 'mixed')),
  ai_action_items TEXT[],
  admin_notes TEXT[] DEFAULT '{}',
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Feedback tags junction table
CREATE TABLE IF NOT EXISTS feedback_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  UNIQUE(feedback_id, tag_id)
);

-- Feedback question responses
CREATE TABLE IF NOT EXISTS feedback_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  response_value TEXT, -- For text/textarea
  response_number INTEGER, -- For rating
  response_option TEXT, -- For multiple choice
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(feedback_id, question_id)
);

-- Clarification requests
CREATE TABLE IF NOT EXISTS clarifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  response TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  responded_at TIMESTAMPTZ
);

-- Admin users table (for auth)
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE branding_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE clarifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Categories: Public read, admin write
CREATE POLICY "categories_public_read" ON categories FOR SELECT USING (is_active = true);
CREATE POLICY "categories_admin_all" ON categories FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = true)
);

-- Tags: Public read, admin write
CREATE POLICY "tags_public_read" ON tags FOR SELECT USING (is_active = true);
CREATE POLICY "tags_admin_all" ON tags FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = true)
);

-- Questions: Public read active, admin write
CREATE POLICY "questions_public_read" ON questions FOR SELECT USING (is_active = true);
CREATE POLICY "questions_admin_all" ON questions FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = true)
);

-- Branding: Public read, admin write
CREATE POLICY "branding_public_read" ON branding_settings FOR SELECT USING (true);
CREATE POLICY "branding_admin_all" ON branding_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = true)
);

-- Notification settings: Admin only
CREATE POLICY "notification_admin_all" ON notification_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = true)
);

-- Feedback: Public insert (anonymous), admin read/update
CREATE POLICY "feedback_public_insert" ON feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "feedback_public_select_own" ON feedback FOR SELECT USING (true); -- For access code lookup
CREATE POLICY "feedback_admin_all" ON feedback FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = true)
);

-- Feedback tags: Public insert, admin all
CREATE POLICY "feedback_tags_public_insert" ON feedback_tags FOR INSERT WITH CHECK (true);
CREATE POLICY "feedback_tags_public_read" ON feedback_tags FOR SELECT USING (true);
CREATE POLICY "feedback_tags_admin_all" ON feedback_tags FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = true)
);

-- Feedback responses: Public insert, admin read
CREATE POLICY "feedback_responses_public_insert" ON feedback_responses FOR INSERT WITH CHECK (true);
CREATE POLICY "feedback_responses_public_read" ON feedback_responses FOR SELECT USING (true);
CREATE POLICY "feedback_responses_admin_all" ON feedback_responses FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = true)
);

-- Clarifications: Public insert response, admin manage
CREATE POLICY "clarifications_public_read" ON clarifications FOR SELECT USING (true);
CREATE POLICY "clarifications_public_update" ON clarifications FOR UPDATE USING (true); -- For responding
CREATE POLICY "clarifications_admin_all" ON clarifications FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = true)
);

-- Admin users: Self read, super_admin manage
CREATE POLICY "admin_users_self_read" ON admin_users FOR SELECT USING (id = auth.uid());
CREATE POLICY "admin_users_super_admin_all" ON admin_users FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role = 'super_admin' AND is_active = true)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_urgency ON feedback(urgency);
CREATE INDEX IF NOT EXISTS idx_feedback_category ON feedback(category_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_moderation_status ON feedback(moderation_status);
CREATE INDEX IF NOT EXISTS idx_feedback_access_code_hash ON feedback(access_code_hash);
CREATE INDEX IF NOT EXISTS idx_clarifications_feedback ON clarifications(feedback_id);
CREATE INDEX IF NOT EXISTS idx_feedback_tags_feedback ON feedback_tags(feedback_id);
CREATE INDEX IF NOT EXISTS idx_feedback_responses_feedback ON feedback_responses(feedback_id);
