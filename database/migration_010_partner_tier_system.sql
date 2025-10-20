-- Migration 010: Enhanced Partner Tier System
-- Adds new tier structure with duration options, prize packages, and web/dev services

-- Add new tier and duration columns to partner_signups
ALTER TABLE partner_signups ADD COLUMN tier TEXT DEFAULT 'spot_partner';
ALTER TABLE partner_signups ADD COLUMN duration TEXT DEFAULT 'monthly'; -- monthly, quarterly, yearly
ALTER TABLE partner_signups ADD COLUMN tier_amount INTEGER DEFAULT 0;

-- Prize package addon tracking
ALTER TABLE partner_signups ADD COLUMN has_prize_package INTEGER DEFAULT 0; -- 0 = no, 1 = yes
ALTER TABLE partner_signups ADD COLUMN prize_package_fee INTEGER DEFAULT 0;
ALTER TABLE partner_signups ADD COLUMN prize_value INTEGER DEFAULT 0;
ALTER TABLE partner_signups ADD COLUMN prize_types TEXT; -- JSON array: ["gift_cards", "tickets", "swag"]
ALTER TABLE partner_signups ADD COLUMN prize_description TEXT;
ALTER TABLE partner_signups ADD COLUMN prize_submitted INTEGER DEFAULT 0; -- 0 = not submitted, 1 = submitted
ALTER TABLE partner_signups ADD COLUMN prize_submission_date TEXT;
ALTER TABLE partner_signups ADD COLUMN prize_fulfillment_method TEXT; -- physical_ship, digital_code, voucher, experience

-- Web/dev services addon tracking
ALTER TABLE partner_signups ADD COLUMN has_webdev_services INTEGER DEFAULT 0;
ALTER TABLE partner_signups ADD COLUMN webdev_services TEXT; -- JSON array: ["landing_page", "ecommerce"]
ALTER TABLE partner_signups ADD COLUMN webdev_total_fee INTEGER DEFAULT 0;
ALTER TABLE partner_signups ADD COLUMN webdev_completed INTEGER DEFAULT 0;

-- Billing tracking for recurring/duration-based partnerships
ALTER TABLE partner_signups ADD COLUMN billing_start_date TEXT;
ALTER TABLE partner_signups ADD COLUMN billing_end_date TEXT;
ALTER TABLE partner_signups ADD COLUMN auto_renew INTEGER DEFAULT 0; -- 1 for monthly subscriptions
ALTER TABLE partner_signups ADD COLUMN stripe_subscription_id TEXT; -- For monthly recurring

-- Total payment tracking
ALTER TABLE partner_signups ADD COLUMN total_paid INTEGER DEFAULT 0; -- tier_amount + prize_package_fee + webdev_total_fee

-- Create prizes table for tracking individual prizes
CREATE TABLE IF NOT EXISTS partner_prizes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  partner_signup_id INTEGER NOT NULL,
  prize_type TEXT NOT NULL, -- gift_card, ticket, swag, experience, service, cash, hybrid
  prize_name TEXT NOT NULL,
  prize_value INTEGER NOT NULL,
  prize_quantity INTEGER DEFAULT 1,
  prize_description TEXT,

  -- Submission tracking
  submitted INTEGER DEFAULT 0,
  submission_method TEXT, -- physical_ship, digital_code, voucher, experience_booking
  tracking_number TEXT, -- For shipped items
  digital_codes TEXT, -- JSON array of codes for digital prizes
  redemption_instructions TEXT,

  -- Winner assignment
  assigned_to_winner TEXT, -- user_id when won
  winner_notified_date TEXT,
  prize_claimed INTEGER DEFAULT 0,
  prize_shipped_date TEXT,

  -- Metadata
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (partner_signup_id) REFERENCES partner_signups(id)
);

-- Create webdev_services table for tracking individual service deliverables
CREATE TABLE IF NOT EXISTS partner_webdev_services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  partner_signup_id INTEGER NOT NULL,
  service_type TEXT NOT NULL, -- landing_page, ecommerce, dashboard, api_integration, full_website
  service_amount INTEGER NOT NULL,

  -- Project tracking
  status TEXT DEFAULT 'pending', -- pending, in_progress, completed, cancelled
  requirements TEXT, -- JSON with service-specific requirements
  deliverable_url TEXT,
  completion_date TEXT,

  -- Notes and communication
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (partner_signup_id) REFERENCES partner_signups(id)
);

-- Create partner_tier_history table for tracking tier changes and renewals
CREATE TABLE IF NOT EXISTS partner_tier_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  partner_signup_id INTEGER NOT NULL,
  tier TEXT NOT NULL,
  duration TEXT NOT NULL,
  amount_paid INTEGER NOT NULL,
  billing_start TEXT NOT NULL,
  billing_end TEXT NOT NULL,

  -- Metadata
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (partner_signup_id) REFERENCES partner_signups(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_partner_tier ON partner_signups(tier);
CREATE INDEX IF NOT EXISTS idx_partner_duration ON partner_signups(duration);
CREATE INDEX IF NOT EXISTS idx_partner_has_prizes ON partner_signups(has_prize_package);
CREATE INDEX IF NOT EXISTS idx_partner_billing_end ON partner_signups(billing_end_date);
CREATE INDEX IF NOT EXISTS idx_prizes_partner ON partner_prizes(partner_signup_id);
CREATE INDEX IF NOT EXISTS idx_prizes_assigned ON partner_prizes(assigned_to_winner);
CREATE INDEX IF NOT EXISTS idx_webdev_partner ON partner_webdev_services(partner_signup_id);
CREATE INDEX IF NOT EXISTS idx_webdev_status ON partner_webdev_services(status);

-- Migrate existing partner_signups data to new tier structure
-- Map old package types to new tiers
UPDATE partner_signups SET
  tier = CASE
    WHEN package = 'single' THEN 'spot_partner'
    WHEN package = 'seasonal' THEN 'featured_partner'
    WHEN package = 'multi_location' THEN 'spot_partner'
    WHEN package = 'event' THEN 'spot_partner'
    WHEN package = 'launch' THEN 'chamber_tourism'
    WHEN package = 'city' THEN 'chamber_tourism'
    WHEN package = 'regional' THEN 'chamber_tourism'
    ELSE 'spot_partner'
  END,
  duration = CASE
    WHEN package IN ('single', 'multi_location', 'event') THEN 'monthly'
    WHEN package = 'seasonal' THEN 'quarterly'
    WHEN package IN ('launch', 'city', 'regional') THEN 'quarterly'
    ELSE 'monthly'
  END,
  tier_amount = CASE
    WHEN package = 'single' THEN 99
    WHEN package = 'seasonal' THEN 249
    WHEN package = 'multi_location' THEN 149
    WHEN package = 'event' THEN 199
    WHEN package = 'launch' THEN 299
    WHEN package = 'city' THEN 599
    WHEN package = 'regional' THEN 1999
    ELSE 0
  END,
  total_paid = tier_amount
WHERE tier IS NULL OR tier = 'spot_partner';

-- Add trigger to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_partner_prizes_timestamp
AFTER UPDATE ON partner_prizes
BEGIN
  UPDATE partner_prizes SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_webdev_services_timestamp
AFTER UPDATE ON partner_webdev_services
BEGIN
  UPDATE partner_webdev_services SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Add comments/notes for documentation
-- This migration introduces the enhanced partner tier system with:
-- 1. Five partnership tiers (Spot, Featured, Premium, Title, Chamber)
-- 2. Duration options (monthly, quarterly, yearly) with 2-3 month discounts
-- 3. Optional prize package add-ons with upfront submission requirement
-- 4. Optional web/dev service add-ons
-- 5. Proper billing cycle tracking
-- 6. Prize management and winner fulfillment tracking
-- 7. Web/dev project deliverable tracking
