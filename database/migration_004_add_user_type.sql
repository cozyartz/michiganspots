-- Migration 004: Add user_type to signups table
-- Adds user type field to track interest type (player, business, chamber, community, other)

ALTER TABLE signups ADD COLUMN user_type TEXT DEFAULT 'player';

-- Add index for user_type for analytics queries
CREATE INDEX IF NOT EXISTS idx_signups_user_type ON signups(user_type);
