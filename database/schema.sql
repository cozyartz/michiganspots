-- Michigan Spots Database Schema
-- Cloudflare D1 (SQLite)

-- Signups table
CREATE TABLE IF NOT EXISTS signups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  user_type TEXT DEFAULT 'player',
  created_at TEXT NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_signups_email ON signups(email);
CREATE INDEX idx_signups_city ON signups(city);
CREATE INDEX idx_signups_created_at ON signups(created_at);
CREATE INDEX idx_signups_user_type ON signups(user_type);

-- Users table (for full app later)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  reddit_username TEXT,
  avatar_url TEXT,
  total_spots INTEGER DEFAULT 0,
  total_badges INTEGER DEFAULT 0,
  team_id INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Spots table (enhanced with business information)
CREATE TABLE IF NOT EXISTS spots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  city TEXT NOT NULL,
  category TEXT,

  -- Detailed location info
  address TEXT,
  neighborhood TEXT,
  zip_code TEXT,

  -- Business details
  business_type TEXT, -- restaurant, park, attraction, shop, etc.
  phone TEXT,
  website TEXT,
  hours_of_operation TEXT, -- JSON string with daily hours
  price_level INTEGER, -- 1-4 ($, $$, $$$, $$$$)

  -- Features and amenities
  amenities TEXT, -- JSON array: parking, wifi, outdoor_seating, etc.
  tags TEXT, -- JSON array: family_friendly, dog_friendly, etc.
  accessibility_features TEXT, -- JSON array: wheelchair_accessible, etc.

  -- Business verification
  is_verified INTEGER DEFAULT 0,
  claimed_by_owner INTEGER DEFAULT 0,
  owner_user_id INTEGER,

  -- User engagement
  user_id INTEGER NOT NULL,
  image_url TEXT,
  votes INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  favorite_count INTEGER DEFAULT 0,
  check_in_count INTEGER DEFAULT 0,
  rating_average REAL DEFAULT 0.0,
  rating_count INTEGER DEFAULT 0,

  -- Moderation
  status TEXT DEFAULT 'pending', -- pending, approved, rejected, flagged
  moderation_notes TEXT,

  created_at TEXT NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (owner_user_id) REFERENCES users(id)
);

CREATE INDEX idx_spots_city ON spots(city);
CREATE INDEX idx_spots_user ON spots(user_id);
CREATE INDEX idx_spots_votes ON spots(votes);
CREATE INDEX idx_spots_category ON spots(category);
CREATE INDEX idx_spots_status ON spots(status);
CREATE INDEX idx_spots_neighborhood ON spots(neighborhood);
CREATE INDEX idx_spots_rating ON spots(rating_average);
CREATE INDEX idx_spots_views ON spots(view_count);

-- Challenges table
CREATE TABLE IF NOT EXISTS challenges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  challenge_type TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  city TEXT,
  sponsor TEXT,
  sponsor_tier TEXT,
  rewards TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Badges table
CREATE TABLE IF NOT EXISTS badges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  badge_tier TEXT NOT NULL,
  icon_url TEXT,
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER,
  created_at TEXT NOT NULL
);

-- User badges (junction table)
CREATE TABLE IF NOT EXISTS user_badges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  badge_id INTEGER NOT NULL,
  earned_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (badge_id) REFERENCES badges(id),
  UNIQUE(user_id, badge_id)
);

-- Teams table (city-based)
CREATE TABLE IF NOT EXISTS teams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  city TEXT NOT NULL,
  total_spots INTEGER DEFAULT 0,
  total_members INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);

-- Leaderboards
CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  score INTEGER NOT NULL,
  rank INTEGER NOT NULL,
  leaderboard_type TEXT NOT NULL,
  period TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_leaderboard_type ON leaderboard_entries(leaderboard_type);
CREATE INDEX idx_leaderboard_period ON leaderboard_entries(period);

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

CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_spot ON favorites(spot_id);

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

CREATE INDEX idx_checkins_user ON check_ins(user_id);
CREATE INDEX idx_checkins_spot ON check_ins(spot_id);
CREATE INDEX idx_checkins_date ON check_ins(created_at);

-- Reviews and ratings
CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  spot_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
  title TEXT,
  review_text TEXT,
  helpful_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'published', -- published, flagged, removed
  created_at TEXT NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (spot_id) REFERENCES spots(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, spot_id)
);

CREATE INDEX idx_reviews_spot ON reviews(spot_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);

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

CREATE INDEX idx_photos_spot ON photos(spot_id);
CREATE INDEX idx_photos_user ON photos(user_id);

-- Comments on spots
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  spot_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  parent_comment_id INTEGER, -- for threaded replies
  comment_text TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'published',
  created_at TEXT NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (spot_id) REFERENCES spots(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (parent_comment_id) REFERENCES comments(id)
);

CREATE INDEX idx_comments_spot ON comments(spot_id);
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_comments_parent ON comments(parent_comment_id);

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

CREATE INDEX idx_follows_follower ON user_follows(follower_id);
CREATE INDEX idx_follows_following ON user_follows(following_id);

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

CREATE INDEX idx_challenge_participants_challenge ON challenge_participants(challenge_id);
CREATE INDEX idx_challenge_participants_user ON challenge_participants(user_id);

-- Analytics: Spot views
CREATE TABLE IF NOT EXISTS spot_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  spot_id INTEGER NOT NULL,
  user_id INTEGER, -- nullable for anonymous views
  session_id TEXT,
  referrer TEXT,
  viewed_at TEXT NOT NULL,
  FOREIGN KEY (spot_id) REFERENCES spots(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_spot_views_spot ON spot_views(spot_id);
CREATE INDEX idx_spot_views_date ON spot_views(viewed_at);
CREATE INDEX idx_spot_views_user ON spot_views(user_id);

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

CREATE INDEX idx_search_queries_query ON search_queries(query);
CREATE INDEX idx_search_queries_date ON search_queries(searched_at);
CREATE INDEX idx_search_queries_city ON search_queries(city);

-- Sponsor payments and tracking
CREATE TABLE IF NOT EXISTS sponsor_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  challenge_id INTEGER NOT NULL,
  sponsor_name TEXT NOT NULL,
  sponsor_tier TEXT NOT NULL, -- bronze, silver, gold, platinum
  amount REAL NOT NULL,
  payment_status TEXT DEFAULT 'pending', -- pending, paid, refunded
  payment_method TEXT,
  transaction_id TEXT,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  paid_at TEXT,
  FOREIGN KEY (challenge_id) REFERENCES challenges(id)
);

CREATE INDEX idx_sponsor_payments_challenge ON sponsor_payments(challenge_id);
CREATE INDEX idx_sponsor_payments_status ON sponsor_payments(payment_status);

-- Notifications for users
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL, -- badge_earned, challenge_complete, new_follower, comment, etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_entity_type TEXT, -- spot, user, challenge, badge
  related_entity_id INTEGER,
  is_read INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_date ON notifications(created_at);

-- Content moderation and reports
CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reporter_user_id INTEGER NOT NULL,
  reported_entity_type TEXT NOT NULL, -- spot, review, comment, photo, user
  reported_entity_id INTEGER NOT NULL,
  report_reason TEXT NOT NULL, -- spam, inappropriate, inaccurate, offensive, etc.
  report_description TEXT,
  status TEXT DEFAULT 'pending', -- pending, reviewing, resolved, dismissed
  resolution TEXT,
  resolved_by_user_id INTEGER,
  resolved_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (reporter_user_id) REFERENCES users(id),
  FOREIGN KEY (resolved_by_user_id) REFERENCES users(id)
);

CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_entity ON reports(reported_entity_type, reported_entity_id);
CREATE INDEX idx_reports_date ON reports(created_at);

-- User activity feed
CREATE TABLE IF NOT EXISTS activity_feed (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  activity_type TEXT NOT NULL, -- spot_added, check_in, badge_earned, review_posted, etc.
  activity_data TEXT, -- JSON with activity details
  visibility TEXT DEFAULT 'public', -- public, followers, private
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_activity_user ON activity_feed(user_id);
CREATE INDEX idx_activity_date ON activity_feed(created_at);
CREATE INDEX idx_activity_type ON activity_feed(activity_type);

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

CREATE INDEX idx_daily_analytics_date ON daily_analytics(date);

-- Partner signups (quick interest form)
CREATE TABLE IF NOT EXISTS partner_signups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  organization_name TEXT NOT NULL,
  partnership_type TEXT NOT NULL, -- chamber, business, community
  city TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  created_at TEXT NOT NULL,
  contacted INTEGER DEFAULT 0,
  contacted_at TEXT
);

CREATE INDEX idx_partner_signups_email ON partner_signups(email);
CREATE INDEX idx_partner_signups_type ON partner_signups(partnership_type);
CREATE INDEX idx_partner_signups_city ON partner_signups(city);
CREATE INDEX idx_partner_signups_created ON partner_signups(created_at);
CREATE INDEX idx_partner_signups_contacted ON partner_signups(contacted);

-- Partner payments (Stripe integration)
CREATE TABLE IF NOT EXISTS partner_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  organization_name TEXT NOT NULL,
  partnership_type TEXT NOT NULL,
  partnership_tier TEXT NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  stripe_payment_intent_id TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  payment_status TEXT DEFAULT 'pending',
  is_recurring INTEGER DEFAULT 0,
  payment_metadata TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  intake_form_id TEXT
);

CREATE INDEX idx_partner_payments_email ON partner_payments(email);
CREATE INDEX idx_partner_payments_customer ON partner_payments(stripe_customer_id);
CREATE INDEX idx_partner_payments_status ON partner_payments(payment_status);
CREATE INDEX idx_partner_payments_type ON partner_payments(partnership_type);

-- Stripe customers
CREATE TABLE IF NOT EXISTS stripe_customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  organization_name TEXT NOT NULL,
  stripe_customer_id TEXT NOT NULL UNIQUE,
  phone TEXT,
  city TEXT,
  has_active_subscription INTEGER DEFAULT 0,
  subscription_ends_at TEXT,
  customer_metadata TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stripe_customers_email ON stripe_customers(email);
CREATE INDEX idx_stripe_customers_stripe_id ON stripe_customers(stripe_customer_id);
CREATE INDEX idx_stripe_customers_active ON stripe_customers(has_active_subscription);

-- Stripe webhook events log
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  event_data TEXT NOT NULL,
  processed INTEGER DEFAULT 0,
  processing_error TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_webhook_events_type ON stripe_webhook_events(event_type);
CREATE INDEX idx_webhook_events_processed ON stripe_webhook_events(processed);
CREATE INDEX idx_webhook_events_created ON stripe_webhook_events(created_at);

-- Partnership activations
CREATE TABLE IF NOT EXISTS partnership_activations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  organization_name TEXT NOT NULL,
  partnership_type TEXT NOT NULL,
  partnership_tier TEXT NOT NULL,
  partner_payment_id INTEGER NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  starts_at TEXT NOT NULL,
  ends_at TEXT,
  is_active INTEGER DEFAULT 1,
  challenges_remaining INTEGER,
  challenges_used INTEGER DEFAULT 0,
  activation_metadata TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (partner_payment_id) REFERENCES partner_payments(id)
);

CREATE INDEX idx_activations_email ON partnership_activations(email);
CREATE INDEX idx_activations_customer ON partnership_activations(stripe_customer_id);
CREATE INDEX idx_activations_active ON partnership_activations(is_active);
CREATE INDEX idx_activations_type ON partnership_activations(partnership_type);
CREATE INDEX idx_activations_ends ON partnership_activations(ends_at);
