-- Embedding Health Monitoring Logs
-- Migration 032: Add health check and regeneration logging
-- Created: November 2025
--
-- Tracks automated health checks and embedding regeneration via cron jobs

-- Embedding Health Log Table
CREATE TABLE IF NOT EXISTS embedding_health_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Health Metrics
  total_businesses INTEGER NOT NULL,
  with_embeddings INTEGER NOT NULL,
  missing_embeddings INTEGER NOT NULL,
  coverage_percentage REAL NOT NULL, -- 0.0 to 100.0

  -- Status
  health_status TEXT NOT NULL, -- healthy, warning, critical

  -- Timestamp
  checked_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Embedding Regeneration Log Table
CREATE TABLE IF NOT EXISTS embedding_regeneration_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Regeneration Metrics
  attempted_count INTEGER NOT NULL,
  succeeded_count INTEGER NOT NULL,
  failed_count INTEGER NOT NULL,

  -- Trigger Source
  triggered_by TEXT NOT NULL, -- cron, manual, api

  -- Timestamp
  regenerated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_health_log_date ON embedding_health_log(checked_at);
CREATE INDEX IF NOT EXISTS idx_health_log_status ON embedding_health_log(health_status);
CREATE INDEX IF NOT EXISTS idx_regeneration_log_date ON embedding_regeneration_log(regenerated_at);

-- Health Monitoring View (Last 30 Days)
CREATE VIEW IF NOT EXISTS embedding_health_trend AS
SELECT
  DATE(checked_at) as check_date,
  AVG(coverage_percentage) as avg_coverage,
  MIN(coverage_percentage) as min_coverage,
  MAX(coverage_percentage) as max_coverage,
  COUNT(*) as check_count
FROM embedding_health_log
WHERE DATE(checked_at) >= DATE('now', '-30 days')
GROUP BY DATE(checked_at)
ORDER BY check_date DESC;

-- Migration completion log
INSERT INTO migration_log (migration_name) VALUES ('migration_032_embedding_health_logs');
