-- Business Scraper System
-- Migration 033: Add scraper run logging
-- Created: November 2025
--
-- Tracks automated business discovery and import runs

-- Scraper Run Log Table
CREATE TABLE IF NOT EXISTS scraper_run_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Search Parameters
  search_city TEXT NOT NULL,
  search_category TEXT NOT NULL,

  -- Results
  businesses_discovered INTEGER NOT NULL DEFAULT 0,
  businesses_imported INTEGER NOT NULL DEFAULT 0,
  duplicates_skipped INTEGER NOT NULL DEFAULT 0,
  errors INTEGER NOT NULL DEFAULT 0,

  -- Metadata
  run_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_scraper_log_date ON scraper_run_log(run_at);
CREATE INDEX IF NOT EXISTS idx_scraper_log_city ON scraper_run_log(search_city);

-- Scraper Statistics View (Last 30 Days)
CREATE VIEW IF NOT EXISTS scraper_stats AS
SELECT
  COUNT(*) as total_runs,
  SUM(businesses_discovered) as total_discovered,
  SUM(businesses_imported) as total_imported,
  SUM(duplicates_skipped) as total_duplicates,
  SUM(errors) as total_errors,
  DATE(run_at) as run_date
FROM scraper_run_log
WHERE DATE(run_at) >= DATE('now', '-30 days')
GROUP BY DATE(run_at)
ORDER BY run_date DESC;

-- Migration completion log
INSERT INTO migration_log (migration_name) VALUES ('migration_033_business_scraper');
