-- Migration 011: Legal Compliance & Audit System
-- Adds comprehensive legal tracking, document versioning, and audit logging

-- =====================================================
-- NEW TABLE: legal_documents
-- Stores versioned agreement templates
-- =====================================================
CREATE TABLE IF NOT EXISTS legal_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_type TEXT NOT NULL, -- 'partnership_agreement', 'terms_of_service', etc.
  version_number TEXT NOT NULL, -- '1.0', '1.1', '2.0', etc.
  effective_date TEXT NOT NULL, -- When this version became active
  expiration_date TEXT, -- When this version was superseded (NULL if current)
  agreement_html TEXT NOT NULL, -- Full HTML content of agreement
  agreement_text TEXT NOT NULL, -- Plain text version for fallback
  changelog TEXT, -- Description of changes from previous version
  created_by TEXT, -- Admin who created this version
  created_at TEXT NOT NULL,
  is_current INTEGER DEFAULT 0, -- 1 if this is the active version

  UNIQUE(document_type, version_number)
);

CREATE INDEX IF NOT EXISTS idx_legal_documents_current ON legal_documents(document_type, is_current);
CREATE INDEX IF NOT EXISTS idx_legal_documents_effective ON legal_documents(effective_date);

-- =====================================================
-- NEW TABLE: partnership_document_versions
-- Links each partnership to the specific agreement version they signed
-- =====================================================
CREATE TABLE IF NOT EXISTS partnership_document_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  partnership_activation_id INTEGER NOT NULL,
  legal_document_id INTEGER NOT NULL,
  signed_at TEXT NOT NULL,
  pdf_url TEXT, -- Cloudflare R2 URL to signed PDF
  pdf_storage_key TEXT, -- R2 object key for retrieval
  created_at TEXT NOT NULL,

  FOREIGN KEY (partnership_activation_id) REFERENCES partnership_activations(id),
  FOREIGN KEY (legal_document_id) REFERENCES legal_documents(id)
);

CREATE INDEX IF NOT EXISTS idx_partnership_doc_versions_activation ON partnership_document_versions(partnership_activation_id);
CREATE INDEX IF NOT EXISTS idx_partnership_doc_versions_document ON partnership_document_versions(legal_document_id);

-- =====================================================
-- NEW TABLE: legal_audit_log
-- Complete audit trail of all legal/compliance events
-- =====================================================
CREATE TABLE IF NOT EXISTS legal_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL, -- 'agreement_preview', 'payment_succeeded', 'agreement_accepted', etc.
  partnership_activation_id INTEGER, -- NULL for system events
  user_id INTEGER, -- NULL if not user-specific
  ip_address TEXT,
  user_agent TEXT,
  event_timestamp TEXT NOT NULL,
  event_metadata TEXT, -- JSON with event-specific data
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_legal_audit_log_event_type ON legal_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_legal_audit_log_partnership ON legal_audit_log(partnership_activation_id);
CREATE INDEX IF NOT EXISTS idx_legal_audit_log_timestamp ON legal_audit_log(event_timestamp);

-- =====================================================
-- ALTER TABLE: partnership_agreements
-- Add enhanced tracking fields
-- =====================================================
ALTER TABLE partnership_agreements ADD COLUMN user_agent TEXT;
ALTER TABLE partnership_agreements ADD COLUMN document_version_id INTEGER;
ALTER TABLE partnership_agreements ADD COLUMN pdf_url TEXT;
ALTER TABLE partnership_agreements ADD COLUMN pdf_storage_key TEXT;
ALTER TABLE partnership_agreements ADD COLUMN preview_timestamp TEXT;
ALTER TABLE partnership_agreements ADD COLUMN acceptance_timestamp TEXT;

-- =====================================================
-- ALTER TABLE: partnership_activations
-- Add admin review and refund tracking
-- =====================================================
ALTER TABLE partnership_activations ADD COLUMN requires_manual_review INTEGER DEFAULT 0;
ALTER TABLE partnership_activations ADD COLUMN admin_reviewed_at TEXT;
ALTER TABLE partnership_activations ADD COLUMN admin_reviewed_by TEXT;
ALTER TABLE partnership_activations ADD COLUMN admin_review_status TEXT; -- 'approved', 'rejected', 'pending'
ALTER TABLE partnership_activations ADD COLUMN admin_review_notes TEXT;
ALTER TABLE partnership_activations ADD COLUMN refund_initiated_at TEXT;
ALTER TABLE partnership_activations ADD COLUMN refund_reason TEXT;
ALTER TABLE partnership_activations ADD COLUMN refund_amount REAL;

-- =====================================================
-- NEW TABLE: agreement_preview_log
-- Track when partners preview agreements (pre-payment)
-- =====================================================
CREATE TABLE IF NOT EXISTS agreement_preview_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  partner_signup_id INTEGER NOT NULL,
  legal_document_id INTEGER NOT NULL,
  preview_opened_at TEXT NOT NULL,
  preview_duration_seconds INTEGER, -- How long they viewed it
  preview_checkbox_checked INTEGER DEFAULT 0,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL,

  FOREIGN KEY (partner_signup_id) REFERENCES partner_signups(id),
  FOREIGN KEY (legal_document_id) REFERENCES legal_documents(id)
);

CREATE INDEX IF NOT EXISTS idx_agreement_preview_signup ON agreement_preview_log(partner_signup_id);
CREATE INDEX IF NOT EXISTS idx_agreement_preview_document ON agreement_preview_log(legal_document_id);

-- =====================================================
-- NEW TABLE: refund_queue
-- Tracks partnerships pending auto-refund (7-day non-acceptance)
-- =====================================================
CREATE TABLE IF NOT EXISTS refund_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  partnership_activation_id INTEGER NOT NULL,
  payment_intent_id TEXT NOT NULL,
  payment_amount REAL NOT NULL,
  eligible_for_refund_at TEXT NOT NULL, -- payment_date + 7 days
  refund_processed INTEGER DEFAULT 0,
  refund_processed_at TEXT,
  refund_id TEXT, -- Stripe refund ID
  notification_sent INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,

  FOREIGN KEY (partnership_activation_id) REFERENCES partnership_activations(id),
  UNIQUE(partnership_activation_id)
);

CREATE INDEX IF NOT EXISTS idx_refund_queue_eligible ON refund_queue(eligible_for_refund_at, refund_processed);
CREATE INDEX IF NOT EXISTS idx_refund_queue_partnership ON refund_queue(partnership_activation_id);

-- =====================================================
-- SEED DATA: Insert default partnership agreement v1.0
-- =====================================================
INSERT INTO legal_documents (
  document_type,
  version_number,
  effective_date,
  agreement_html,
  agreement_text,
  changelog,
  created_by,
  created_at,
  is_current
) VALUES (
  'partnership_agreement',
  '1.0',
  datetime('now'),
  '<p>This will be replaced with actual agreement content from PARTNERSHIP-AGREEMENT.md</p>',
  'This will be replaced with actual agreement content from PARTNERSHIP-AGREEMENT.md',
  'Initial version of partnership agreement',
  'system',
  datetime('now'),
  1
);

-- =====================================================
-- Add indexes for performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_partnership_activations_review ON partnership_activations(requires_manual_review, admin_review_status);
CREATE INDEX IF NOT EXISTS idx_partnership_activations_refund ON partnership_activations(refund_initiated_at);
