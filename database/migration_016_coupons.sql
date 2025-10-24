-- Migration 016: Discount Coupons System
-- Date: 2025-10-24
-- Coupon codes for sales reps and promotional discounts

CREATE TABLE IF NOT EXISTS coupons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL, -- 'percentage' or 'fixed'
  discount_value INTEGER NOT NULL, -- percentage (0-100) or cents for fixed

  -- Restrictions
  applies_to TEXT NOT NULL, -- 'yearly_only', 'services_only', 'all'
  min_purchase INTEGER, -- minimum purchase amount in cents
  max_uses INTEGER, -- null = unlimited
  uses_count INTEGER DEFAULT 0,

  -- Status
  is_active INTEGER DEFAULT 1,
  valid_from TEXT NOT NULL,
  valid_until TEXT, -- null = no expiration

  -- Metadata
  description TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Coupon usage tracking
CREATE TABLE IF NOT EXISTS coupon_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  coupon_id INTEGER NOT NULL,
  in_person_signup_id INTEGER,

  -- What was purchased
  original_amount INTEGER NOT NULL, -- cents
  discount_amount INTEGER NOT NULL, -- cents
  final_amount INTEGER NOT NULL, -- cents

  -- Who used it
  used_by_rep TEXT, -- sales rep name
  customer_email TEXT,
  customer_name TEXT,

  -- When
  used_at TEXT NOT NULL,

  FOREIGN KEY (coupon_id) REFERENCES coupons(id),
  FOREIGN KEY (in_person_signup_id) REFERENCES in_person_signups(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon ON coupon_usage(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_signup ON coupon_usage(in_person_signup_id);

-- Add coupon tracking to in_person_signups
ALTER TABLE in_person_signups ADD COLUMN coupon_code TEXT;
ALTER TABLE in_person_signups ADD COLUMN coupon_discount INTEGER DEFAULT 0;
ALTER TABLE in_person_signups ADD COLUMN original_amount INTEGER;

-- Seed initial coupons
INSERT INTO coupons (code, discount_type, discount_value, applies_to, min_purchase, max_uses, is_active, valid_from, description, created_by, created_at)
VALUES
  -- 50% off yearly plans (Founders Special)
  ('FOUNDERS50', 'percentage', 50, 'yearly_only', 0, NULL, 1, datetime('now'), '50% off any yearly partnership - Founders Special', 'system', datetime('now')),

  -- 30% off yearly plans
  ('YEARLY30', 'percentage', 30, 'yearly_only', 0, NULL, 1, datetime('now'), '30% off yearly partnerships', 'system', datetime('now')),

  -- 50% off web/dev services
  ('WEBDEV50', 'percentage', 50, 'services_only', 0, NULL, 1, datetime('now'), '50% off web & development services', 'system', datetime('now')),

  -- 30% off web/dev services
  ('WEBDEV30', 'percentage', 30, 'services_only', 0, NULL, 1, datetime('now'), '30% off web & development services', 'system', datetime('now'));
