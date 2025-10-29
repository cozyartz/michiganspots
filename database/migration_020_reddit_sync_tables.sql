-- Reddit Game Data Sync Tables
-- Real-time synchronization from Reddit Devvit app to Cloudflare D1

-- Game Completions
-- Stores all game completion events from Reddit app
CREATE TABLE IF NOT EXISTS game_completions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  game TEXT NOT NULL, -- 'photo-hunt', 'trivia', 'word-search', 'memory-match'
  score INTEGER NOT NULL,
  quality INTEGER DEFAULT 0,
  michigan_relevance INTEGER DEFAULT 0,
  landmark_bonus INTEGER DEFAULT 0,
  creativity INTEGER DEFAULT 0,
  post_id TEXT,
  timestamp INTEGER NOT NULL,
  source TEXT NOT NULL DEFAULT 'reddit-devvit',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- User Statistics
-- Aggregate user performance data synced from Reddit
CREATE TABLE IF NOT EXISTS user_statistics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  total_score INTEGER NOT NULL DEFAULT 0,
  games_played INTEGER NOT NULL DEFAULT 0,
  game_breakdown TEXT, -- JSON: {"photo-hunt": {...}, "trivia": {...}, ...}
  global_rank INTEGER,
  last_played INTEGER,
  last_updated INTEGER NOT NULL,
  source TEXT NOT NULL DEFAULT 'reddit-devvit',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Leaderboard Positions
-- Individual leaderboard entries for each game and time period
CREATE TABLE IF NOT EXISTS leaderboard_positions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  game TEXT NOT NULL, -- 'photo-hunt', 'trivia', 'word-search', 'memory-match', 'overall'
  period TEXT NOT NULL, -- 'alltime', 'weekly', 'monthly'
  period_key TEXT NOT NULL, -- 'alltime', '2024-W43', '2024-10', etc.
  score INTEGER NOT NULL,
  total_score INTEGER,
  rank INTEGER NOT NULL,
  timestamp INTEGER NOT NULL,
  source TEXT NOT NULL DEFAULT 'reddit-devvit',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(username, game, period_key)
);

-- Challenge Progress
-- Tracks user progress through location-based challenges
CREATE TABLE IF NOT EXISTS challenge_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  challenge_id TEXT NOT NULL,
  landmark_name TEXT NOT NULL,
  photo_score INTEGER NOT NULL,
  gps_latitude REAL,
  gps_longitude REAL,
  gps_accuracy REAL,
  completed_landmarks TEXT, -- JSON array: ["Renaissance Center", "Hart Plaza"]
  total_score INTEGER NOT NULL DEFAULT 0,
  challenge_completed INTEGER NOT NULL DEFAULT 0, -- boolean: 0 = false, 1 = true
  completed_at INTEGER,
  timestamp INTEGER NOT NULL,
  source TEXT NOT NULL DEFAULT 'reddit-devvit',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(username, challenge_id, landmark_name)
);

-- Achievement Unlocks
-- Individual achievement unlock records
CREATE TABLE IF NOT EXISTS achievement_unlocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  achievement_id TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  achievement_description TEXT,
  achievement_icon TEXT,
  achievement_points INTEGER NOT NULL DEFAULT 0,
  unlocked_at INTEGER NOT NULL,
  timestamp INTEGER NOT NULL,
  source TEXT NOT NULL DEFAULT 'reddit-devvit',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(username, achievement_id)
);

-- Sync Status Tracking
-- Monitor health and performance of sync operations
CREATE TABLE IF NOT EXISTS sync_status (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  endpoint TEXT NOT NULL, -- '/api/analytics/game-complete', etc.
  status TEXT NOT NULL, -- 'success', 'error', 'warning'
  record_count INTEGER DEFAULT 0,
  error_message TEXT,
  duration_ms INTEGER,
  timestamp INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for game_completions
CREATE INDEX IF NOT EXISTS idx_game_completions_username ON game_completions(username);
CREATE INDEX IF NOT EXISTS idx_game_completions_game ON game_completions(game);
CREATE INDEX IF NOT EXISTS idx_game_completions_timestamp ON game_completions(timestamp);

-- Indexes for user_statistics
CREATE INDEX IF NOT EXISTS idx_user_statistics_username ON user_statistics(username);
CREATE INDEX IF NOT EXISTS idx_user_statistics_total_score ON user_statistics(total_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_statistics_global_rank ON user_statistics(global_rank);

-- Indexes for leaderboard_positions
CREATE INDEX IF NOT EXISTS idx_leaderboard_positions_game_period ON leaderboard_positions(game, period_key, rank);
CREATE INDEX IF NOT EXISTS idx_leaderboard_positions_username ON leaderboard_positions(username);
CREATE INDEX IF NOT EXISTS idx_leaderboard_positions_rank ON leaderboard_positions(rank);

-- Indexes for challenge_progress
CREATE INDEX IF NOT EXISTS idx_challenge_progress_username ON challenge_progress(username);
CREATE INDEX IF NOT EXISTS idx_challenge_progress_challenge ON challenge_progress(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_progress_completed ON challenge_progress(challenge_completed);

-- Indexes for achievement_unlocks
CREATE INDEX IF NOT EXISTS idx_achievement_unlocks_username ON achievement_unlocks(username);
CREATE INDEX IF NOT EXISTS idx_achievement_unlocks_achievement ON achievement_unlocks(achievement_id);
CREATE INDEX IF NOT EXISTS idx_achievement_unlocks_unlocked_at ON achievement_unlocks(unlocked_at);

-- Indexes for sync_status
CREATE INDEX IF NOT EXISTS idx_sync_status_endpoint ON sync_status(endpoint);
CREATE INDEX IF NOT EXISTS idx_sync_status_timestamp ON sync_status(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sync_status_status ON sync_status(status);
