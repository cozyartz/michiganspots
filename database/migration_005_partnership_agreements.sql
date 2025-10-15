-- Migration 005: Partnership Agreements Table
-- Stores electronic signatures and acceptance records

CREATE TABLE IF NOT EXISTS partnership_agreements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  partnership_activation_id INTEGER NOT NULL,
  full_name TEXT NOT NULL,
  title TEXT NOT NULL,
  ip_address TEXT,
  accepted_date TEXT NOT NULL,
  checkboxes_accepted TEXT, -- JSON of checkbox confirmations
  agreement_version TEXT DEFAULT '1.0',
  created_at TEXT NOT NULL,

  FOREIGN KEY (partnership_activation_id) REFERENCES partnership_activations(id)
);

-- Add agreement_accepted flag to partnership_activations
ALTER TABLE partnership_activations ADD COLUMN agreement_accepted INTEGER DEFAULT 0;

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_partnership_agreements_activation ON partnership_agreements(partnership_activation_id);
CREATE INDEX IF NOT EXISTS idx_partnership_activations_agreement ON partnership_activations(agreement_accepted);
