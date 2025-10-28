-- Migration: Blog System with NeuronWriter Integration
-- Date: 2025-10-28
-- Comprehensive blog system for Michigan Spots with NeuronWriter API integration

-- Blog posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Content
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE, -- URL-friendly version of title
  excerpt TEXT, -- Short description for listings
  content TEXT NOT NULL, -- Full HTML content
  featured_image_url TEXT,

  -- SEO
  meta_title TEXT, -- Custom SEO title (defaults to title)
  meta_description TEXT, -- Meta description for search engines
  keywords TEXT, -- Comma-separated keywords

  -- NeuronWriter Integration
  neuronwriter_query_id TEXT UNIQUE, -- Link to NeuronWriter query
  neuronwriter_project_id TEXT, -- NeuronWriter project ID
  neuronwriter_score INTEGER, -- SEO score from NeuronWriter
  neuronwriter_last_sync TEXT, -- Last time synced with NeuronWriter

  -- Organization
  category TEXT, -- michigan-travel, local-business, community-events, etc.
  tags TEXT, -- JSON array of tags

  -- Publishing
  status TEXT NOT NULL DEFAULT 'draft', -- draft, published, scheduled, archived
  published_at TEXT, -- When the post was published
  scheduled_for TEXT, -- For scheduled posts

  -- Author tracking
  author_email TEXT NOT NULL, -- Email of author (admin)
  author_name TEXT NOT NULL,

  -- Engagement metrics
  view_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TEXT NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

  -- Foreign key to users/admins
  FOREIGN KEY (author_email) REFERENCES users(email)
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author ON blog_posts(author_email);
CREATE INDEX IF NOT EXISTS idx_blog_posts_neuronwriter_query ON blog_posts(neuronwriter_query_id);

-- Blog categories table
CREATE TABLE IF NOT EXISTS blog_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT, -- Lucide icon name or emoji
  display_order INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0, -- Denormalized for performance
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_blog_categories_slug ON blog_categories(slug);

-- Insert default categories
INSERT OR IGNORE INTO blog_categories (name, slug, description, icon, display_order, created_at) VALUES
  ('Michigan Travel', 'michigan-travel', 'Discover hidden gems and travel destinations across Michigan', 'Map', 1, datetime('now')),
  ('Local Business Spotlight', 'local-business', 'Featuring Michigan''s amazing local businesses and entrepreneurs', 'Store', 2, datetime('now')),
  ('Community Events', 'community-events', 'What''s happening in Michigan communities', 'Calendar', 3, datetime('now')),
  ('Challenge Guides', 'challenge-guides', 'Tips and tricks for completing Michigan Spots challenges', 'Trophy', 4, datetime('now')),
  ('Michigan History', 'michigan-history', 'Stories and history from the Great Lakes State', 'Book', 5, datetime('now')),
  ('Partner Stories', 'partner-stories', 'Success stories from our business partners', 'Heart', 6, datetime('now'));

-- Blog comments table (for future)
CREATE TABLE IF NOT EXISTS blog_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,

  -- Commenter info
  user_email TEXT, -- If logged in
  user_name TEXT NOT NULL,
  reddit_username TEXT, -- If they're a Reddit user

  -- Content
  comment_text TEXT NOT NULL,

  -- Moderation
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, spam, deleted
  moderated_by TEXT, -- Admin who moderated
  moderated_at TEXT,

  -- Timestamps
  created_at TEXT NOT NULL,

  FOREIGN KEY (post_id) REFERENCES blog_posts(id)
);

CREATE INDEX IF NOT EXISTS idx_blog_comments_post ON blog_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_status ON blog_comments(status);
CREATE INDEX IF NOT EXISTS idx_blog_comments_user ON blog_comments(user_email);

-- NeuronWriter sync log
CREATE TABLE IF NOT EXISTS neuronwriter_sync_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Sync details
  query_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  sync_type TEXT NOT NULL, -- import, update, check

  -- Results
  success INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  content_hash TEXT, -- To detect content changes

  -- Metrics from NeuronWriter
  score INTEGER,
  terms_used INTEGER,
  questions_answered INTEGER,

  -- Metadata
  initiated_by TEXT, -- Admin email who triggered sync
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_neuronwriter_sync_query ON neuronwriter_sync_log(query_id);
CREATE INDEX IF NOT EXISTS idx_neuronwriter_sync_project ON neuronwriter_sync_log(project_id);
CREATE INDEX IF NOT EXISTS idx_neuronwriter_sync_created ON neuronwriter_sync_log(created_at);
