-- Business Directory Duplicate Prevention
-- Migration 029: Add indexes for duplicate detection and query performance
-- Created: November 2025
--
-- Note: We use non-unique indexes to avoid breaking existing data
-- Duplicate prevention is handled at application level via seed-business API

-- Add composite index on business name + address for duplicate detection
-- Helps speed up duplicate checking queries
CREATE INDEX IF NOT EXISTS idx_business_name_address_lookup
ON business_directory(business_name, address);

-- Add index on website for duplicate detection
CREATE INDEX IF NOT EXISTS idx_business_website_lookup
ON business_directory(website)
WHERE website IS NOT NULL AND website != '';

-- Add index on email for duplicate detection
CREATE INDEX IF NOT EXISTS idx_business_email_lookup
ON business_directory(email)
WHERE email IS NOT NULL AND email != '';

-- Add index for phone number lookups
CREATE INDEX IF NOT EXISTS idx_business_phone_lookup
ON business_directory(phone)
WHERE phone IS NOT NULL AND phone != '';

-- Add composite index for name + city fuzzy matching
CREATE INDEX IF NOT EXISTS idx_business_name_city_lookup
ON business_directory(business_name, city);

-- Add index for AI processing status to speed up cron job queries
CREATE INDEX IF NOT EXISTS idx_business_ai_status_date
ON business_directory(ai_processing_status, created_at);

-- Migration completion log
INSERT INTO migration_log (migration_name) VALUES ('migration_029_business_duplicate_prevention');
