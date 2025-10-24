-- Michigan Spots Partner Platform Database Schema
-- D1 Database Schema for Cloudflare for Platforms implementation

-- Partners table
CREATE TABLE IF NOT EXISTS partners (
    partner_id TEXT PRIMARY KEY,
    business_name TEXT NOT NULL,
    subdomain TEXT UNIQUE NOT NULL,
    custom_hostname TEXT UNIQUE NOT NULL,
    business_info TEXT NOT NULL, -- JSON blob
    page_content TEXT NOT NULL, -- AI-generated HTML
    qr_code_data TEXT, -- JSON blob with QR code info
    hostname_status TEXT NOT NULL DEFAULT 'pending', -- pending, active, failed
    ssl_status TEXT NOT NULL DEFAULT 'pending', -- pending, active, failed
    status TEXT NOT NULL DEFAULT 'active', -- active, inactive, suspended
    created_at TEXT NOT NULL,
    last_updated TEXT NOT NULL
);

-- Custom hostnames tracking
CREATE TABLE IF NOT EXISTS custom_hostnames (
    id TEXT PRIMARY KEY, -- Cloudflare hostname ID
    partner_id TEXT NOT NULL,
    hostname TEXT NOT NULL,
    status TEXT NOT NULL, -- pending, active, moved, deleted
    ssl_status TEXT NOT NULL, -- pending, active, failed
    verification_errors TEXT, -- JSON array of errors
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (partner_id) REFERENCES partners (partner_id)
);

-- Analytics events
CREATE TABLE IF NOT EXISTS analytics_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    partner_id TEXT NOT NULL,
    event_type TEXT NOT NULL, -- visit, qr_scan, challenge_completion, custom
    event_data TEXT, -- JSON blob
    hostname TEXT,
    user_agent TEXT,
    referer TEXT,
    ip_address TEXT,
    country TEXT,
    timestamp TEXT NOT NULL,
    FOREIGN KEY (partner_id) REFERENCES partners (partner_id)
);

-- Daily analytics aggregates
CREATE TABLE IF NOT EXISTS daily_analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    partner_id TEXT NOT NULL,
    date TEXT NOT NULL, -- YYYY-MM-DD format
    visits INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    qr_scans INTEGER DEFAULT 0,
    challenge_completions INTEGER DEFAULT 0,
    bounce_rate REAL DEFAULT 0.0,
    avg_session_duration INTEGER DEFAULT 0, -- seconds
    top_referrers TEXT, -- JSON array
    device_breakdown TEXT, -- JSON object
    country_breakdown TEXT, -- JSON object
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(partner_id, date),
    FOREIGN KEY (partner_id) REFERENCES partners (partner_id)
);

-- Platform-wide statistics
CREATE TABLE IF NOT EXISTS platform_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL, -- YYYY-MM-DD format
    total_partners INTEGER DEFAULT 0,
    active_partners INTEGER DEFAULT 0,
    total_hostnames INTEGER DEFAULT 0,
    active_hostnames INTEGER DEFAULT 0,
    ssl_active_hostnames INTEGER DEFAULT 0,
    total_visits INTEGER DEFAULT 0,
    total_qr_scans INTEGER DEFAULT 0,
    total_challenges INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    UNIQUE(date)
);

-- QR code tracking
CREATE TABLE IF NOT EXISTS qr_scans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    partner_id TEXT NOT NULL,
    scan_id TEXT UNIQUE NOT NULL,
    hostname TEXT,
    user_agent TEXT,
    referer TEXT,
    ip_address TEXT,
    country TEXT,
    timestamp TEXT NOT NULL,
    FOREIGN KEY (partner_id) REFERENCES partners (partner_id)
);

-- Challenge completions
CREATE TABLE IF NOT EXISTS challenge_completions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    partner_id TEXT NOT NULL,
    challenge_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    completion_data TEXT, -- JSON blob
    points_awarded INTEGER DEFAULT 0,
    timestamp TEXT NOT NULL,
    FOREIGN KEY (partner_id) REFERENCES partners (partner_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_partners_subdomain ON partners (subdomain);
CREATE INDEX IF NOT EXISTS idx_partners_hostname ON partners (custom_hostname);
CREATE INDEX IF NOT EXISTS idx_partners_status ON partners (status);
CREATE INDEX IF NOT EXISTS idx_partners_created_at ON partners (created_at);

CREATE INDEX IF NOT EXISTS idx_hostnames_partner_id ON custom_hostnames (partner_id);
CREATE INDEX IF NOT EXISTS idx_hostnames_hostname ON custom_hostnames (hostname);
CREATE INDEX IF NOT EXISTS idx_hostnames_status ON custom_hostnames (status);

CREATE INDEX IF NOT EXISTS idx_analytics_partner_id ON analytics_events (partner_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events (event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON analytics_events (timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_hostname ON analytics_events (hostname);

CREATE INDEX IF NOT EXISTS idx_daily_analytics_partner_id ON daily_analytics (partner_id);
CREATE INDEX IF NOT EXISTS idx_daily_analytics_date ON daily_analytics (date);

CREATE INDEX IF NOT EXISTS idx_platform_stats_date ON platform_stats (date);

CREATE INDEX IF NOT EXISTS idx_qr_scans_partner_id ON qr_scans (partner_id);
CREATE INDEX IF NOT EXISTS idx_qr_scans_timestamp ON qr_scans (timestamp);

CREATE INDEX IF NOT EXISTS idx_challenge_completions_partner_id ON challenge_completions (partner_id);
CREATE INDEX IF NOT EXISTS idx_challenge_completions_user_id ON challenge_completions (user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_completions_timestamp ON challenge_completions (timestamp);

-- Insert initial platform stats record
INSERT OR IGNORE INTO platform_stats (
    date, 
    total_partners, 
    active_partners, 
    total_hostnames, 
    active_hostnames, 
    ssl_active_hostnames,
    total_visits,
    total_qr_scans,
    total_challenges,
    created_at
) VALUES (
    date('now'),
    0, 0, 0, 0, 0, 0, 0, 0,
    datetime('now')
);