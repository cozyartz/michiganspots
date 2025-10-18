-- Migration 009: Google OAuth and Magic Link Authentication
-- Adds Google OAuth support and general magic links for passwordless authentication

-- Add Google OAuth column to users table
ALTER TABLE users ADD COLUMN google_id TEXT;

-- Create index for Google ID lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;

-- Magic link tokens table for passwordless authentication
CREATE TABLE IF NOT EXISTS magic_link_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at INTEGER NOT NULL, -- Unix timestamp
  used INTEGER DEFAULT 0,
  used_at INTEGER, -- Unix timestamp
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (email) REFERENCES users(email)
);

-- Indexes for magic link tokens
CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_token ON magic_link_tokens(token);
CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_email ON magic_link_tokens(email);
CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_expires ON magic_link_tokens(expires_at);

-- Clean up expired magic links periodically (manual cleanup needed)
-- DELETE FROM magic_link_tokens WHERE expires_at < unixepoch() OR used = 1;
