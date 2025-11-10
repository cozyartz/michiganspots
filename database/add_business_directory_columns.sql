-- ========================================
-- Add Missing Columns to business_directory
-- REMOTE PRODUCTION DATABASE ONLY
-- ========================================
-- Purpose: Add columns for payment tracking, email verification, and photo uploads
-- Date: 2025-11-10
-- ========================================

-- Payment Status Column
-- Tracks Stripe subscription status: active, pending, canceled, past_due, trialing, incomplete, incomplete_expired
ALTER TABLE business_directory ADD COLUMN payment_status TEXT DEFAULT 'none';

-- Email Verification Columns
ALTER TABLE business_directory ADD COLUMN owner_email TEXT;
ALTER TABLE business_directory ADD COLUMN verification_status TEXT DEFAULT 'pending';
ALTER TABLE business_directory ADD COLUMN verification_token TEXT;
ALTER TABLE business_directory ADD COLUMN verification_token_expires TEXT;
ALTER TABLE business_directory ADD COLUMN verified_at TEXT;

-- Photo/Media Columns
ALTER TABLE business_directory ADD COLUMN featured_image_url TEXT;
ALTER TABLE business_directory ADD COLUMN gallery_images TEXT; -- JSON array of image URLs
ALTER TABLE business_directory ADD COLUMN logo_url TEXT;

-- Additional Tracking
ALTER TABLE business_directory ADD COLUMN subscription_start_date TEXT;
ALTER TABLE business_directory ADD COLUMN subscription_end_date TEXT;
ALTER TABLE business_directory ADD COLUMN last_payment_date TEXT;
ALTER TABLE business_directory ADD COLUMN next_billing_date TEXT;

-- Verification & Onboarding
ALTER TABLE business_directory ADD COLUMN onboarding_completed INTEGER DEFAULT 0;
ALTER TABLE business_directory ADD COLUMN onboarding_step TEXT DEFAULT 'claim'; -- claim, verify, payment, profile, complete

-- ========================================
-- Create Indexes for New Columns
-- ========================================
CREATE INDEX IF NOT EXISTS idx_business_directory_payment_status ON business_directory(payment_status);
CREATE INDEX IF NOT EXISTS idx_business_directory_verification_status ON business_directory(verification_status);
CREATE INDEX IF NOT EXISTS idx_business_directory_owner_email ON business_directory(owner_email);
CREATE INDEX IF NOT EXISTS idx_business_directory_verification_token ON business_directory(verification_token);
CREATE INDEX IF NOT EXISTS idx_business_directory_onboarding ON business_directory(onboarding_completed);

-- ========================================
-- Update Existing Records
-- ========================================
-- Set payment_status based on existing stripe_subscription_id
UPDATE business_directory
SET payment_status = CASE
  WHEN stripe_subscription_id IS NOT NULL AND stripe_subscription_id != '' THEN 'active'
  WHEN directory_tier = 'free' THEN 'none'
  ELSE 'none'
END
WHERE payment_status = 'none';

-- Set verification_status for claimed businesses
UPDATE business_directory
SET verification_status = 'verified',
    onboarding_completed = 1,
    onboarding_step = 'complete'
WHERE is_claimed = 1 AND verification_status = 'pending';

-- ========================================
-- VERIFICATION QUERY
-- ========================================
-- Run this after migration to verify:
-- SELECT payment_status, verification_status, COUNT(*) as count
-- FROM business_directory
-- GROUP BY payment_status, verification_status
-- ORDER BY count DESC;
