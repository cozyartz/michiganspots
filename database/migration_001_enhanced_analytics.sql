-- Migration: Enhanced Analytics and Business Data
-- Date: 2025-10-15

-- Add new columns to spots table
ALTER TABLE spots ADD COLUMN address TEXT;
ALTER TABLE spots ADD COLUMN neighborhood TEXT;
ALTER TABLE spots ADD COLUMN zip_code TEXT;
ALTER TABLE spots ADD COLUMN business_type TEXT;
ALTER TABLE spots ADD COLUMN phone TEXT;
ALTER TABLE spots ADD COLUMN website TEXT;
ALTER TABLE spots ADD COLUMN hours_of_operation TEXT;
ALTER TABLE spots ADD COLUMN price_level INTEGER;
ALTER TABLE spots ADD COLUMN amenities TEXT;
ALTER TABLE spots ADD COLUMN tags TEXT;
ALTER TABLE spots ADD COLUMN accessibility_features TEXT;
ALTER TABLE spots ADD COLUMN is_verified INTEGER DEFAULT 0;
ALTER TABLE spots ADD COLUMN claimed_by_owner INTEGER DEFAULT 0;
ALTER TABLE spots ADD COLUMN owner_user_id INTEGER;
ALTER TABLE spots ADD COLUMN view_count INTEGER DEFAULT 0;
ALTER TABLE spots ADD COLUMN favorite_count INTEGER DEFAULT 0;
ALTER TABLE spots ADD COLUMN check_in_count INTEGER DEFAULT 0;
ALTER TABLE spots ADD COLUMN rating_average REAL DEFAULT 0.0;
ALTER TABLE spots ADD COLUMN rating_count INTEGER DEFAULT 0;
ALTER TABLE spots ADD COLUMN moderation_notes TEXT;

-- Create new indexes for spots table
CREATE INDEX IF NOT EXISTS idx_spots_category ON spots(category);
CREATE INDEX IF NOT EXISTS idx_spots_status ON spots(status);
CREATE INDEX IF NOT EXISTS idx_spots_neighborhood ON spots(neighborhood);
CREATE INDEX IF NOT EXISTS idx_spots_rating ON spots(rating_average);
CREATE INDEX IF NOT EXISTS idx_spots_views ON spots(view_count);

-- User favorites/bookmarks
CREATE TABLE IF NOT EXISTS favorites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  spot_id INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (spot_id) REFERENCES spots(id),
  UNIQUE(user_id, spot_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_spot ON favorites(spot_id);

-- Check-ins at spots
CREATE TABLE IF NOT EXISTS check_ins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  spot_id INTEGER NOT NULL,
  notes TEXT,
  photo_url TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (spot_id) REFERENCES spots(id)
);

CREATE INDEX IF NOT EXISTS idx_checkins_user ON check_ins(user_id);
CREATE INDEX IF NOT EXISTS idx_checkins_spot ON check_ins(spot_id);
CREATE INDEX IF NOT EXISTS idx_checkins_date ON check_ins(created_at);

-- Reviews and ratings
CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  spot_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
  title TEXT,
  review_text TEXT,
  helpful_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'published',
  created_at TEXT NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (spot_id) REFERENCES spots(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, spot_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_spot ON reviews(spot_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

-- Photos uploaded by users
CREATE TABLE IF NOT EXISTS photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  spot_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  photo_url TEXT NOT NULL,
  caption TEXT,
  is_primary INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'published',
  created_at TEXT NOT NULL,
  FOREIGN KEY (spot_id) REFERENCES spots(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_photos_spot ON photos(spot_id);
CREATE INDEX IF NOT EXISTS idx_photos_user ON photos(user_id);

-- Comments on spots
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  spot_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  parent_comment_id INTEGER,
  comment_text TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'published',
  created_at TEXT NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (spot_id) REFERENCES spots(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (parent_comment_id) REFERENCES comments(id)
);

CREATE INDEX IF NOT EXISTS idx_comments_spot ON comments(spot_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_comment_id);

-- User follows/connections
CREATE TABLE IF NOT EXISTS user_follows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  follower_id INTEGER NOT NULL,
  following_id INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (follower_id) REFERENCES users(id),
  FOREIGN KEY (following_id) REFERENCES users(id),
  UNIQUE(follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON user_follows(following_id);

-- Challenge participants
CREATE TABLE IF NOT EXISTS challenge_participants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  challenge_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  progress INTEGER DEFAULT 0,
  completed INTEGER DEFAULT 0,
  completed_at TEXT,
  reward_claimed INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (challenge_id) REFERENCES challenges(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(challenge_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge ON challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user ON challenge_participants(user_id);

-- Analytics: Spot views
CREATE TABLE IF NOT EXISTS spot_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  spot_id INTEGER NOT NULL,
  user_id INTEGER,
  session_id TEXT,
  referrer TEXT,
  viewed_at TEXT NOT NULL,
  FOREIGN KEY (spot_id) REFERENCES spots(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_spot_views_spot ON spot_views(spot_id);
CREATE INDEX IF NOT EXISTS idx_spot_views_date ON spot_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_spot_views_user ON spot_views(user_id);

-- Analytics: Search queries
CREATE TABLE IF NOT EXISTS search_queries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  query TEXT NOT NULL,
  city TEXT,
  category TEXT,
  results_count INTEGER DEFAULT 0,
  clicked_spot_id INTEGER,
  searched_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (clicked_spot_id) REFERENCES spots(id)
);

CREATE INDEX IF NOT EXISTS idx_search_queries_query ON search_queries(query);
CREATE INDEX IF NOT EXISTS idx_search_queries_date ON search_queries(searched_at);
CREATE INDEX IF NOT EXISTS idx_search_queries_city ON search_queries(city);

-- Sponsor payments and tracking
CREATE TABLE IF NOT EXISTS sponsor_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  challenge_id INTEGER NOT NULL,
  sponsor_name TEXT NOT NULL,
  sponsor_tier TEXT NOT NULL,
  amount REAL NOT NULL,
  payment_status TEXT DEFAULT 'pending',
  payment_method TEXT,
  transaction_id TEXT,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  paid_at TEXT,
  FOREIGN KEY (challenge_id) REFERENCES challenges(id)
);

CREATE INDEX IF NOT EXISTS idx_sponsor_payments_challenge ON sponsor_payments(challenge_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_payments_status ON sponsor_payments(payment_status);

-- Notifications for users
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_entity_type TEXT,
  related_entity_id INTEGER,
  is_read INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_date ON notifications(created_at);

-- Content moderation and reports
CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reporter_user_id INTEGER NOT NULL,
  reported_entity_type TEXT NOT NULL,
  reported_entity_id INTEGER NOT NULL,
  report_reason TEXT NOT NULL,
  report_description TEXT,
  status TEXT DEFAULT 'pending',
  resolution TEXT,
  resolved_by_user_id INTEGER,
  resolved_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (reporter_user_id) REFERENCES users(id),
  FOREIGN KEY (resolved_by_user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_entity ON reports(reported_entity_type, reported_entity_id);
CREATE INDEX IF NOT EXISTS idx_reports_date ON reports(created_at);

-- User activity feed
CREATE TABLE IF NOT EXISTS activity_feed (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  activity_type TEXT NOT NULL,
  activity_data TEXT,
  visibility TEXT DEFAULT 'public',
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_feed(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_date ON activity_feed(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_type ON activity_feed(activity_type);

-- Platform analytics summary (daily aggregations)
CREATE TABLE IF NOT EXISTS daily_analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,
  total_signups INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  new_spots INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  total_check_ins INTEGER DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_photos INTEGER DEFAULT 0,
  challenges_completed INTEGER DEFAULT 0,
  sponsor_revenue REAL DEFAULT 0,
  top_city TEXT,
  top_category TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_daily_analytics_date ON daily_analytics(date);
