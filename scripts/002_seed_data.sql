-- Seed default categories
INSERT INTO categories (name, label, description, color, icon, sort_order) VALUES
  ('workplace', 'Workplace Environment', 'Physical workspace, facilities, and equipment', '#10b981', 'building', 1),
  ('management', 'Management & Leadership', 'Leadership style, decision making, and management practices', '#6366f1', 'users', 2),
  ('process', 'Processes & Procedures', 'Workflows, policies, and operational procedures', '#f59e0b', 'settings', 3),
  ('culture', 'Company Culture', 'Values, team dynamics, and organizational culture', '#ec4899', 'heart', 4),
  ('compensation', 'Compensation & Benefits', 'Salary, benefits, and perks', '#8b5cf6', 'dollar-sign', 5),
  ('safety', 'Safety & Compliance', 'Safety concerns and compliance issues', '#ef4444', 'shield', 6),
  ('other', 'Other', 'General feedback that doesn''t fit other categories', '#6b7280', 'folder', 7)
ON CONFLICT (name) DO NOTHING;

-- Seed default tags
INSERT INTO tags (name, color, sort_order) VALUES
  ('Communication', '#3b82f6', 1),
  ('Training', '#10b981', 2),
  ('Resources', '#f59e0b', 3),
  ('Workload', '#ef4444', 4),
  ('Recognition', '#8b5cf6', 5),
  ('Diversity', '#ec4899', 6),
  ('Innovation', '#06b6d4', 7),
  ('Collaboration', '#84cc16', 8),
  ('Transparency', '#f97316', 9),
  ('Growth', '#14b8a6', 10)
ON CONFLICT (name) DO NOTHING;

-- Seed default questions
INSERT INTO questions (question_type, question_text, description, min_value, max_value, is_required, sort_order) VALUES
  ('rating', 'Overall Experience', 'Rate your overall experience with the organization', 1, 5, true, 1),
  ('rating', 'Job Satisfaction', 'How satisfied are you with your current role?', 1, 5, true, 2),
  ('rating', 'Management Support', 'How well does management support your work?', 1, 5, true, 3)
ON CONFLICT DO NOTHING;

-- Seed default branding settings
INSERT INTO branding_settings (id, site_name, site_description) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Anonymous Feedback Portal', 'Share your thoughts openly and honestly. Your identity is protected through advanced encryption and privacy measures.')
ON CONFLICT (id) DO NOTHING;

-- Seed default notification settings
INSERT INTO notification_settings (notification_type, is_enabled, config) VALUES
  ('email', false, '{}'),
  ('slack', false, '{}'),
  ('telegram', false, '{}'),
  ('webhook', false, '{}')
ON CONFLICT (notification_type) DO NOTHING;
