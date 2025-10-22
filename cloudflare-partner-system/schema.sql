-- Michigan Spots Partner System Database Schema
-- D1 Database Schema for partner management

-- Partners table
CREATE TABLE IF NOT EXISTS partners (
    partner_id TEXT PRIMARY KEY,
    business_name TEXT NOT NULL,
    business_info TEXT NOT NULL, -- JSON blob
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL,
    last_updated TEXT NOT NULL,
    worker_url TEXT,
    qr_code_url TEXT
);

-- Partner analytics table
CREATE TABLE IF NOT EXISTS partner_analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    partner_id TEXT NOT NULL,
    event_type TEXT NOT NULL, -- 'visit', 'qr_scan', 'challenge_completion'
    event_data TEXT, -- JSON blob
    timestamp TEXT NOT NULL,
    user_id TEXT,
    source TEXT,
    FOREIGN KEY (partner_id) REFERENCES partners (partner_id)
);

-- QR code scans table
CREATE TABLE IF NOT EXISTS qr_scans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    partner_id TEXT NOT NULL,
    scan_id TEXT UNIQUE NOT NULL,
    user_agent TEXT,
    referrer TEXT,
    location TEXT,
    timestamp TEXT NOT NULL,
    FOREIGN KEY (partner_id) REFERENCES partners (partner_id)
);

-- Challenge completions table
CREATE TABLE IF NOT EXISTS challenge_completions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    partner_id TEXT NOT NULL,
    challenge_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    completion_data TEXT, -- JSON blob
    timestamp TEXT NOT NULL,
    points_awarded INTEGER DEFAULT 0,
    FOREIGN KEY (partner_id) REFERENCES partners (partner_id)
);

-- Worker deployments table
CREATE TABLE IF NOT EXISTS worker_deployments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    partner_id TEXT NOT NULL,
    worker_name TEXT NOT NULL,
    worker_url TEXT NOT NULL,
    deployment_status TEXT NOT NULL DEFAULT 'deployed',
    deployed_at TEXT NOT NULL,
    last_updated TEXT,
    FOREIGN KEY (partner_id) REFERENCES partners (partner_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_partners_status ON partners (status);
CREATE INDEX IF NOT EXISTS idx_partners_created_at ON partners (created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_partner_id ON partner_analytics (partner_id);
CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON partner_analytics (timestamp);
CREATE INDEX IF NOT EXISTS idx_qr_scans_partner_id ON qr_scans (partner_id);
CREATE INDEX IF NOT EXISTS idx_qr_scans_timestamp ON qr_scans (timestamp);
CREATE INDEX IF NOT EXISTS idx_challenge_completions_partner_id ON challenge_completions (partner_id);
CREATE INDEX IF NOT EXISTS idx_challenge_completions_user_id ON challenge_completions (user_id);
CREATE INDEX IF NOT EXISTS idx_worker_deployments_partner_id ON worker_deployments (partner_id);