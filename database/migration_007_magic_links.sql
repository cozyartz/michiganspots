-- Migration 007: Partner Magic Links for Authentication
-- Stores temporary tokens for partner dashboard access

CREATE TABLE IF NOT EXISTS partner_magic_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  partner_id INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  used INTEGER DEFAULT 0,
  used_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (partner_id) REFERENCES partnership_activations(id)
);

CREATE INDEX IF NOT EXISTS idx_partner_magic_links_token ON partner_magic_links(token);
CREATE INDEX IF NOT EXISTS idx_partner_magic_links_partner ON partner_magic_links(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_magic_links_expires ON partner_magic_links(expires_at);

-- Add sponsor_id to challenges table if it doesn't exist
ALTER TABLE challenges ADD COLUMN sponsor_id INTEGER;
ALTER TABLE challenges ADD COLUMN reddit_post_url TEXT;

CREATE INDEX IF NOT EXISTS idx_challenges_sponsor ON challenges(sponsor_id);
