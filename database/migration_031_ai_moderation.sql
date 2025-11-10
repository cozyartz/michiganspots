-- AI Content Moderation System
-- Migration 031: Add AI moderation logging and rules
-- Created: November 2025
--
-- Uses Cloudflare AI's DistilBERT SST-2 for sentiment/toxicity classification

-- Content Moderation Log Table
CREATE TABLE IF NOT EXISTS content_moderation_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Content Reference
  content_type TEXT NOT NULL, -- review, comment, description, message, post
  content_id INTEGER, -- Reference to the content being moderated
  content_text TEXT NOT NULL, -- The actual text that was analyzed

  -- AI Classification Results
  ai_model TEXT DEFAULT '@cf/huggingface/distilbert-sst-2-int8',
  classification_label TEXT NOT NULL, -- POSITIVE, NEGATIVE, TOXIC, SPAM, etc.
  confidence_score REAL NOT NULL, -- 0.0 to 1.0

  -- Additional Analysis
  sentiment TEXT, -- positive, neutral, negative
  toxicity_score REAL DEFAULT 0, -- 0.0 to 1.0
  spam_score REAL DEFAULT 0, -- 0.0 to 1.0

  -- Moderation Action
  action_taken TEXT NOT NULL, -- approved, flagged, auto_rejected, removed, pending_review
  action_reason TEXT, -- Why this action was taken
  auto_moderated INTEGER DEFAULT 1, -- 1 if automatic, 0 if manual
  moderator_id INTEGER, -- User ID who took manual action

  -- Metadata
  user_id INTEGER, -- User who submitted the content
  ip_address TEXT,
  user_agent TEXT,

  -- Timestamps
  analyzed_at TEXT DEFAULT CURRENT_TIMESTAMP,
  action_at TEXT DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_moderation_content_type ON content_moderation_log(content_type);
CREATE INDEX IF NOT EXISTS idx_moderation_action ON content_moderation_log(action_taken);
CREATE INDEX IF NOT EXISTS idx_moderation_date ON content_moderation_log(analyzed_at);
CREATE INDEX IF NOT EXISTS idx_moderation_user ON content_moderation_log(user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_confidence ON content_moderation_log(confidence_score);

-- Moderation Rules Configuration Table
CREATE TABLE IF NOT EXISTS moderation_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Rule Configuration
  rule_name TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL, -- Which content type this applies to
  enabled INTEGER DEFAULT 1,

  -- Thresholds
  toxicity_threshold REAL DEFAULT 0.8, -- Auto-reject if toxicity > this
  spam_threshold REAL DEFAULT 0.7, -- Auto-reject if spam > this
  negative_sentiment_threshold REAL DEFAULT 0.9, -- Flag if negative > this

  -- Actions
  auto_reject_enabled INTEGER DEFAULT 0, -- Auto-reject toxic/spam content
  auto_flag_enabled INTEGER DEFAULT 1, -- Auto-flag suspicious content
  require_manual_review INTEGER DEFAULT 0, -- Force manual review

  -- Notification
  notify_on_flag INTEGER DEFAULT 1,
  notify_on_reject INTEGER DEFAULT 1,
  notification_email TEXT,

  -- Metadata
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,

  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Default Moderation Rules
INSERT INTO moderation_rules (rule_name, content_type, toxicity_threshold, spam_threshold, auto_reject_enabled, auto_flag_enabled)
VALUES
  ('business_descriptions', 'description', 0.8, 0.7, 1, 1),
  ('user_reviews', 'review', 0.75, 0.65, 1, 1),
  ('user_comments', 'comment', 0.7, 0.6, 0, 1),
  ('chat_messages', 'message', 0.9, 0.8, 1, 1);

-- Moderation Statistics View
CREATE VIEW IF NOT EXISTS moderation_stats AS
SELECT
  content_type,
  COUNT(*) as total_analyzed,
  SUM(CASE WHEN action_taken = 'auto_rejected' THEN 1 ELSE 0 END) as auto_rejected,
  SUM(CASE WHEN action_taken = 'flagged' THEN 1 ELSE 0 END) as flagged,
  SUM(CASE WHEN action_taken = 'approved' THEN 1 ELSE 0 END) as approved,
  SUM(CASE WHEN action_taken = 'removed' THEN 1 ELSE 0 END) as removed,
  AVG(confidence_score) as avg_confidence,
  AVG(toxicity_score) as avg_toxicity,
  AVG(spam_score) as avg_spam,
  DATE(analyzed_at) as analysis_date
FROM content_moderation_log
GROUP BY content_type, DATE(analyzed_at);

-- Migration completion log
INSERT INTO migration_log (migration_name) VALUES ('migration_031_ai_moderation');
