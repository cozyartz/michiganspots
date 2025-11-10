-- Vector Embeddings for Semantic Search
-- Migration 030: Add vector embedding storage for AI-powered semantic search
-- Created: November 2025
--
-- Uses Cloudflare AI's BGE-base-en-v1.5 model for 768-dimension embeddings

-- Business embeddings table
CREATE TABLE IF NOT EXISTS business_embeddings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_id INTEGER NOT NULL,

  -- Vector embedding (768 dimensions from BGE-base-en-v1.5)
  embedding_vector TEXT NOT NULL, -- JSON array of 768 floats

  -- Embedding metadata
  embedding_text TEXT, -- Source text used to generate embedding
  embedding_version TEXT DEFAULT 'bge-base-en-v1.5-v1', -- Model version

  -- Timestamps
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (business_id) REFERENCES business_directory(id) ON DELETE CASCADE,
  UNIQUE(business_id) -- One embedding per business
);

-- Index for fast business lookups
CREATE INDEX IF NOT EXISTS idx_business_embeddings_business_id
ON business_embeddings(business_id);

-- Index for embedding version tracking
CREATE INDEX IF NOT EXISTS idx_business_embeddings_version
ON business_embeddings(embedding_version);

-- Migration completion log
INSERT INTO migration_log (migration_name) VALUES ('migration_030_vector_embeddings');
