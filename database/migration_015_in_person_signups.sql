-- Migration 015: In-Person Partner Signups with Digital Signatures
-- Date: 2025-10-23
-- Stores in-person partner signups with digital signatures for iPad/tablet signing

CREATE TABLE IF NOT EXISTS in_person_signups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Confirmation ID for reference
  confirmation_id TEXT NOT NULL UNIQUE,

  -- Partner info
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  organization_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  partnership_type TEXT NOT NULL DEFAULT 'business', -- chamber, business, community

  -- Tier and pricing
  tier TEXT NOT NULL,
  duration TEXT NOT NULL,
  tier_amount INTEGER NOT NULL, -- amount in cents
  total_paid INTEGER NOT NULL, -- amount in cents

  -- Agreement
  has_read_agreement INTEGER NOT NULL DEFAULT 0,
  signature_url TEXT, -- R2 URL to signature image
  signature_date TEXT NOT NULL,
  ip_address TEXT,

  -- Payment tracking
  payment_method TEXT DEFAULT 'in_person_paypal',
  payment_status TEXT DEFAULT 'pending', -- pending, completed, failed
  payment_collected_at TEXT,
  payment_collected_by TEXT, -- Staff member who collected payment
  payment_transaction_id TEXT, -- PayPal transaction ID

  -- Status tracking
  status TEXT DEFAULT 'pending_payment', -- pending_payment, active, cancelled
  activated_at TEXT,
  cancelled_at TEXT,
  cancellation_reason TEXT,

  -- Metadata
  notes TEXT,
  metadata TEXT, -- JSON for additional data
  created_at TEXT NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for lookups
CREATE INDEX IF NOT EXISTS idx_in_person_signups_confirmation ON in_person_signups(confirmation_id);
CREATE INDEX IF NOT EXISTS idx_in_person_signups_email ON in_person_signups(email);
CREATE INDEX IF NOT EXISTS idx_in_person_signups_organization ON in_person_signups(organization_name);
CREATE INDEX IF NOT EXISTS idx_in_person_signups_payment_status ON in_person_signups(payment_status);
CREATE INDEX IF NOT EXISTS idx_in_person_signups_status ON in_person_signups(status);
CREATE INDEX IF NOT EXISTS idx_in_person_signups_created ON in_person_signups(created_at);

-- Add column to partnership_activations to link in-person signups
ALTER TABLE partnership_activations ADD COLUMN in_person_signup_id INTEGER;
CREATE INDEX IF NOT EXISTS idx_activations_in_person ON partnership_activations(in_person_signup_id);
