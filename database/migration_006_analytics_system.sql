-- Migration 006: Analytics System for Partner Reporting
-- Tracks challenge completions, engagement events, and partner analytics

-- Track individual challenge completions from Devvit app
CREATE TABLE IF NOT EXISTS challenge_completions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  challenge_id INTEGER NOT NULL,
  user_reddit_username TEXT NOT NULL,
  completed_at TEXT NOT NULL,
  submission_url TEXT, -- Reddit post/comment URL
  submission_type TEXT, -- 'post' or 'comment'
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (challenge_id) REFERENCES challenges(id)
);

CREATE INDEX IF NOT EXISTS idx_challenge_completions_challenge ON challenge_completions(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_completions_user ON challenge_completions(user_reddit_username);
CREATE INDEX IF NOT EXISTS idx_challenge_completions_date ON challenge_completions(completed_at);

-- Track engagement events from Devvit (views, comments, upvotes, etc.)
CREATE TABLE IF NOT EXISTS engagement_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL, -- 'view', 'comment', 'upvote', 'share', 'award'
  challenge_id INTEGER,
  spot_id INTEGER,
  user_reddit_username TEXT,
  post_id TEXT, -- Reddit post ID
  comment_id TEXT, -- Reddit comment ID
  event_data TEXT, -- JSON blob for additional data
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_engagement_events_type ON engagement_events(event_type);
CREATE INDEX IF NOT EXISTS idx_engagement_events_challenge ON engagement_events(challenge_id);
CREATE INDEX IF NOT EXISTS idx_engagement_events_spot ON engagement_events(spot_id);
CREATE INDEX IF NOT EXISTS idx_engagement_events_date ON engagement_events(created_at);

-- Partner analytics summary (aggregated daily by scheduled worker)
CREATE TABLE IF NOT EXISTS partner_analytics_daily (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  partner_id INTEGER NOT NULL,
  date TEXT NOT NULL, -- YYYY-MM-DD
  challenge_views INTEGER DEFAULT 0,
  challenge_completions INTEGER DEFAULT 0,
  challenge_comments INTEGER DEFAULT 0,
  challenge_upvotes INTEGER DEFAULT 0,
  challenge_shares INTEGER DEFAULT 0,
  challenge_awards INTEGER DEFAULT 0,
  unique_participants INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (partner_id) REFERENCES partnership_activations(id),
  UNIQUE(partner_id, date)
);

CREATE INDEX IF NOT EXISTS idx_partner_analytics_daily_partner ON partner_analytics_daily(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_analytics_daily_date ON partner_analytics_daily(date);

-- Email report tracking
CREATE TABLE IF NOT EXISTS partner_reports_sent (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  partner_id INTEGER NOT NULL,
  report_type TEXT NOT NULL, -- 'weekly', 'monthly', 'quarterly'
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  sent_at TEXT NOT NULL DEFAULT (datetime('now')),
  email_to TEXT NOT NULL,
  report_data TEXT, -- JSON snapshot of metrics
  delivery_status TEXT DEFAULT 'sent', -- 'sent', 'failed', 'bounced'
  FOREIGN KEY (partner_id) REFERENCES partnership_activations(id)
);

CREATE INDEX IF NOT EXISTS idx_partner_reports_partner ON partner_reports_sent(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_reports_type ON partner_reports_sent(report_type);
CREATE INDEX IF NOT EXISTS idx_partner_reports_date ON partner_reports_sent(sent_at);

-- Admin dashboard: Track all signups in one view
CREATE VIEW IF NOT EXISTS admin_signups_dashboard AS
SELECT
  'waitlist' as signup_type,
  email,
  NULL as organization_name,
  NULL as contact_name,
  NULL as partnership_type,
  NULL as partnership_tier,
  NULL as amount_paid,
  created_at,
  NULL as agreement_accepted
FROM signups
UNION ALL
SELECT
  'partner' as signup_type,
  sc.email,
  sc.organization_name,
  sc.name as contact_name,
  pa.partnership_type,
  pa.partnership_tier,
  pp.amount as amount_paid,
  pa.created_at,
  pa.agreement_accepted
FROM partnership_activations pa
LEFT JOIN stripe_customers sc ON pa.stripe_customer_id = sc.stripe_customer_id
LEFT JOIN partner_payments pp ON pa.payment_id = pp.id
ORDER BY created_at DESC;
