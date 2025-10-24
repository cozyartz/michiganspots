-- Migration: Add Cloudflare Partner Worker integration fields
-- Stores data from the cloudflare-partner-system worker

ALTER TABLE partner_signups ADD COLUMN worker_partner_id TEXT;
ALTER TABLE partner_signups ADD COLUMN worker_page_url TEXT;
ALTER TABLE partner_signups ADD COLUMN worker_qr_code_url TEXT;
ALTER TABLE partner_signups ADD COLUMN worker_qr_download_url TEXT;
ALTER TABLE partner_signups ADD COLUMN worker_analytics_url TEXT;
ALTER TABLE partner_signups ADD COLUMN worker_onboarded_at TEXT;
ALTER TABLE partner_signups ADD COLUMN worker_status TEXT DEFAULT 'pending'; -- pending, active, failed

-- Add index for worker lookup
CREATE INDEX IF NOT EXISTS idx_partner_signups_worker_partner_id ON partner_signups(worker_partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_signups_worker_status ON partner_signups(worker_status);
