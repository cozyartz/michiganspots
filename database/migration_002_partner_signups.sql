-- Migration: Partner Signups Table
-- Date: 2025-10-15
-- Quick interest signup for partnerships (lighter than full intake forms)

CREATE TABLE IF NOT EXISTS partner_signups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  organization_name TEXT NOT NULL,
  partnership_type TEXT NOT NULL, -- chamber, business, community
  city TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  created_at TEXT NOT NULL,
  contacted INTEGER DEFAULT 0,
  contacted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_partner_signups_email ON partner_signups(email);
CREATE INDEX IF NOT EXISTS idx_partner_signups_type ON partner_signups(partnership_type);
CREATE INDEX IF NOT EXISTS idx_partner_signups_city ON partner_signups(city);
CREATE INDEX IF NOT EXISTS idx_partner_signups_created ON partner_signups(created_at);
CREATE INDEX IF NOT EXISTS idx_partner_signups_contacted ON partner_signups(contacted);
