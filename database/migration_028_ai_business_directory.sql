-- AI-Powered Business Directory System
-- Migration 028: Core directory tables with AI features
-- Created: November 2025

-- Business Directory Core Table
CREATE TABLE IF NOT EXISTS business_directory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  spot_id INTEGER, -- Link to existing spots table
  business_name TEXT NOT NULL,
  business_category TEXT NOT NULL,
  sub_categories TEXT, -- JSON array: ["Coffee", "Breakfast", "WiFi"]

  -- Basic Business Info
  address TEXT,
  city TEXT NOT NULL,
  state TEXT DEFAULT 'Michigan',
  zip_code TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,

  -- Enhanced AI-discoverable fields
  short_description TEXT, -- User-provided brief description
  ai_description TEXT, -- AI-generated comprehensive description
  ai_keywords TEXT, -- JSON array of AI-extracted keywords
  ai_sentiment_score REAL DEFAULT 0.5, -- Sentiment from reviews (0-1)
  ai_category_confidence REAL DEFAULT 0, -- AI classification confidence

  -- Business Details
  hours_of_operation TEXT, -- JSON: {"monday": "9am-5pm", ...}
  price_level INTEGER DEFAULT 2, -- 1-4 ($, $$, $$$, $$$$)
  amenities TEXT, -- JSON: ["parking", "wifi", "outdoor_seating"]
  tags TEXT, -- JSON: ["family_friendly", "dog_friendly"]

  -- AI-powered features
  ai_recommendations TEXT, -- JSON array of related business IDs with scores
  ai_highlights TEXT, -- JSON array of AI-extracted highlights
  ai_faq TEXT, -- JSON: [{"q": "...", "a": "..."}]

  -- Search & Quality Metrics
  search_rank_score REAL DEFAULT 0,
  quality_score REAL DEFAULT 0, -- 0-100 calculated by AI
  relevance_boost REAL DEFAULT 1.0, -- Paid tier multiplier

  -- Partnership & Verification
  directory_tier TEXT DEFAULT 'free', -- free, starter, growth, pro
  tier_start_date TEXT,
  tier_end_date TEXT,
  stripe_subscription_id TEXT,
  is_ai_verified INTEGER DEFAULT 0,
  is_claimed INTEGER DEFAULT 0,
  claimed_by_user_id INTEGER,

  -- Engagement Metrics
  total_views INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  total_shares INTEGER DEFAULT 0,

  -- AI Processing
  last_ai_update TEXT,
  ai_processing_status TEXT DEFAULT 'pending', -- pending, processing, completed, error

  -- Timestamps
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (spot_id) REFERENCES spots(id),
  FOREIGN KEY (claimed_by_user_id) REFERENCES users(id)
);

CREATE INDEX idx_business_directory_category ON business_directory(business_category);
CREATE INDEX idx_business_directory_city ON business_directory(city);
CREATE INDEX idx_business_directory_tier ON business_directory(directory_tier);
CREATE INDEX idx_business_directory_quality ON business_directory(quality_score);
CREATE INDEX idx_business_directory_verified ON business_directory(is_ai_verified);
CREATE INDEX idx_business_directory_claimed ON business_directory(is_claimed);

-- AI Search Analytics Table
CREATE TABLE IF NOT EXISTS ai_search_queries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query_text TEXT NOT NULL,
  user_id INTEGER,
  session_id TEXT,

  -- AI Intent Analysis
  ai_intent TEXT, -- shopping, dining, services, entertainment, research
  ai_extracted_location TEXT, -- Extracted city/area from query
  ai_extracted_category TEXT, -- Extracted business type
  ai_extracted_features TEXT, -- JSON: amenities/features mentioned
  ai_sentiment TEXT, -- positive, neutral, negative
  ai_confidence REAL DEFAULT 0,

  -- Search Results
  results_count INTEGER DEFAULT 0,
  results_shown TEXT, -- JSON array of business IDs shown
  results_clicked TEXT, -- JSON array of business IDs clicked
  top_result_id INTEGER,

  -- Performance Metrics
  processing_time_ms INTEGER,
  user_clicked INTEGER DEFAULT 0, -- Did user click any result
  user_satisfaction INTEGER, -- 1-5 rating if provided

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (top_result_id) REFERENCES business_directory(id)
);

CREATE INDEX idx_ai_search_queries_intent ON ai_search_queries(ai_intent);
CREATE INDEX idx_ai_search_queries_location ON ai_search_queries(ai_extracted_location);
CREATE INDEX idx_ai_search_queries_session ON ai_search_queries(session_id);
CREATE INDEX idx_ai_search_queries_date ON ai_search_queries(created_at);

-- AI-Generated Business Insights
CREATE TABLE IF NOT EXISTS business_ai_insights (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_id INTEGER NOT NULL,

  insight_type TEXT NOT NULL, -- trend, opportunity, risk, recommendation, competitive
  insight_title TEXT NOT NULL,
  insight_description TEXT NOT NULL,
  insight_data TEXT, -- JSON with supporting data/metrics

  confidence_score REAL DEFAULT 0,
  priority TEXT DEFAULT 'medium', -- low, medium, high, critical
  action_items TEXT, -- JSON array of suggested actions

  -- Status
  is_active INTEGER DEFAULT 1,
  is_viewed INTEGER DEFAULT 0,
  is_acted_upon INTEGER DEFAULT 0,

  expires_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (business_id) REFERENCES business_directory(id)
);

CREATE INDEX idx_business_ai_insights_business ON business_ai_insights(business_id);
CREATE INDEX idx_business_ai_insights_priority ON business_ai_insights(priority);
CREATE INDEX idx_business_ai_insights_active ON business_ai_insights(is_active);

-- AI Recommendation Engine Tracking
CREATE TABLE IF NOT EXISTS ai_recommendations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_business_id INTEGER NOT NULL,
  recommended_business_id INTEGER NOT NULL,

  recommendation_type TEXT NOT NULL, -- similar, complement, nearby, trending, popular
  recommendation_reason TEXT, -- Human-readable explanation
  relevance_score REAL DEFAULT 0, -- 0-1 similarity score

  -- Performance Tracking
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0, -- User visited recommended business
  click_through_rate REAL DEFAULT 0,

  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (source_business_id) REFERENCES business_directory(id),
  FOREIGN KEY (recommended_business_id) REFERENCES business_directory(id),
  UNIQUE(source_business_id, recommended_business_id)
);

CREATE INDEX idx_ai_recommendations_source ON ai_recommendations(source_business_id);
CREATE INDEX idx_ai_recommendations_score ON ai_recommendations(relevance_score);
CREATE INDEX idx_ai_recommendations_active ON ai_recommendations(is_active);

-- AI Chat Interaction Logs
CREATE TABLE IF NOT EXISTS ai_chat_interactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  session_id TEXT NOT NULL,

  message_role TEXT NOT NULL, -- user, assistant, system
  message_content TEXT NOT NULL,

  -- Context
  business_id INTEGER, -- If discussing specific business
  search_context TEXT, -- JSON with current search state
  user_location TEXT, -- City/area if available

  -- AI Metrics
  model_used TEXT DEFAULT '@cf/meta/llama-2-7b-chat-int8',
  tokens_used INTEGER DEFAULT 0,
  response_time_ms INTEGER DEFAULT 0,
  confidence_score REAL DEFAULT 0,

  -- User Feedback
  was_helpful INTEGER, -- 1 = yes, 0 = no, null = not rated

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (business_id) REFERENCES business_directory(id)
);

CREATE INDEX idx_ai_chat_session ON ai_chat_interactions(session_id);
CREATE INDEX idx_ai_chat_business ON ai_chat_interactions(business_id);
CREATE INDEX idx_ai_chat_date ON ai_chat_interactions(created_at);

-- Directory Partner Analytics (Daily Aggregates)
CREATE TABLE IF NOT EXISTS directory_partner_analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_id INTEGER NOT NULL,
  date TEXT NOT NULL, -- YYYY-MM-DD format

  -- Discovery Metrics
  search_appearances INTEGER DEFAULT 0,
  search_clicks INTEGER DEFAULT 0,
  profile_views INTEGER DEFAULT 0,
  profile_shares INTEGER DEFAULT 0,

  -- AI-Specific Metrics
  ai_recommendations_shown INTEGER DEFAULT 0,
  ai_recommendations_clicked INTEGER DEFAULT 0,
  ai_chat_mentions INTEGER DEFAULT 0,
  ai_quality_score_avg REAL DEFAULT 0,

  -- Engagement Actions
  directions_requested INTEGER DEFAULT 0,
  phone_clicks INTEGER DEFAULT 0,
  email_clicks INTEGER DEFAULT 0,
  website_clicks INTEGER DEFAULT 0,

  -- Competitive Intelligence
  category_rank INTEGER,
  quality_score_rank INTEGER,
  competitor_views INTEGER DEFAULT 0,

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (business_id) REFERENCES business_directory(id),
  UNIQUE(business_id, date)
);

CREATE INDEX idx_directory_analytics_business ON directory_partner_analytics(business_id);
CREATE INDEX idx_directory_analytics_date ON directory_partner_analytics(date);

-- Directory Pricing Tiers (Reference Table)
CREATE TABLE IF NOT EXISTS directory_pricing_tiers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tier_name TEXT NOT NULL UNIQUE, -- free, starter, growth, pro
  monthly_price INTEGER NOT NULL, -- Price in cents

  -- Feature Flags (JSON)
  features TEXT NOT NULL, -- JSON object with feature availability

  -- Limits
  max_photos INTEGER DEFAULT 3,
  max_highlights INTEGER DEFAULT 3,
  ai_insights_frequency TEXT DEFAULT 'monthly', -- never, monthly, weekly, daily
  support_level TEXT DEFAULT 'email', -- none, email, priority, dedicated

  -- Visibility Boosts
  search_boost_multiplier REAL DEFAULT 1.0,
  recommendation_boost_multiplier REAL DEFAULT 1.0,

  is_active INTEGER DEFAULT 1,
  display_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Insert Launch Pricing Tiers
INSERT INTO directory_pricing_tiers (tier_name, monthly_price, features, max_photos, max_highlights, ai_insights_frequency, support_level, search_boost_multiplier, recommendation_boost_multiplier, display_order)
VALUES
  ('free', 0, '{"basic_listing": true, "search_visibility": true, "monthly_analytics": true, "ai_description": false, "ai_insights": false, "priority_placement": false}', 3, 2, 'never', 'none', 1.0, 1.0, 1),
  ('starter', 4900, '{"basic_listing": true, "search_visibility": true, "monthly_analytics": true, "ai_description": true, "ai_keywords": true, "ai_insights": true, "weekly_reports": true, "competitor_analysis": true, "priority_placement": false}', 8, 5, 'monthly', 'email', 1.3, 1.25, 2),
  ('growth', 9900, '{"basic_listing": true, "search_visibility": true, "monthly_analytics": true, "ai_description": true, "ai_keywords": true, "ai_insights": true, "weekly_reports": true, "competitor_analysis": true, "priority_placement": true, "featured_badge": true, "ai_chat_priority": true, "trend_alerts": true}', 15, 8, 'weekly', 'priority', 1.6, 1.5, 3),
  ('pro', 19900, '{"basic_listing": true, "search_visibility": true, "monthly_analytics": true, "ai_description": true, "ai_keywords": true, "ai_insights": true, "weekly_reports": true, "competitor_analysis": true, "priority_placement": true, "featured_badge": true, "ai_chat_priority": true, "trend_alerts": true, "daily_intelligence": true, "api_access": true, "custom_integration": true, "dedicated_support": true}', 30, 15, 'daily', 'dedicated', 2.0, 2.0, 4);

-- Business Categories (Reference Table)
CREATE TABLE IF NOT EXISTS directory_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_name TEXT NOT NULL UNIQUE,
  parent_category_id INTEGER,
  icon_name TEXT, -- Lucide icon name
  description TEXT,
  is_active INTEGER DEFAULT 1,
  display_order INTEGER DEFAULT 0,

  FOREIGN KEY (parent_category_id) REFERENCES directory_categories(id)
);

-- Insert Common Michigan Business Categories
INSERT INTO directory_categories (category_name, parent_category_id, icon_name, display_order)
VALUES
  ('Restaurants & Dining', NULL, 'UtensilsCrossed', 1),
  ('Shopping & Retail', NULL, 'ShoppingBag', 2),
  ('Arts & Entertainment', NULL, 'Palette', 3),
  ('Services', NULL, 'Briefcase', 4),
  ('Health & Wellness', NULL, 'Heart', 5),
  ('Automotive', NULL, 'Car', 6),
  ('Home & Garden', NULL, 'Home', 7),
  ('Tourism & Attractions', NULL, 'MapPin', 8);

-- Migration completion log
CREATE TABLE IF NOT EXISTS migration_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_name TEXT NOT NULL,
  applied_at TEXT DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO migration_log (migration_name) VALUES ('migration_028_ai_business_directory');
