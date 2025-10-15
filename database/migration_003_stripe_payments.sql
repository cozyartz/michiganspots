-- Migration: Stripe Payment Tracking
-- Date: 2025-10-15
-- Tracks partnership payments and subscriptions via Stripe

-- Partner payments (one-time and recurring)
CREATE TABLE IF NOT EXISTS partner_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Partner identification
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  organization_name TEXT NOT NULL,
  partnership_type TEXT NOT NULL, -- chamber, business, community
  partnership_tier TEXT NOT NULL, -- launch, city, regional, single, seasonal, etc.

  -- Stripe IDs
  stripe_customer_id TEXT NOT NULL,
  stripe_payment_intent_id TEXT, -- for one-time payments
  stripe_subscription_id TEXT, -- for recurring payments
  stripe_price_id TEXT NOT NULL,

  -- Payment details
  amount INTEGER NOT NULL, -- amount in cents
  currency TEXT DEFAULT 'usd',
  payment_status TEXT DEFAULT 'pending', -- pending, succeeded, failed, refunded
  is_recurring INTEGER DEFAULT 0,

  -- Metadata
  payment_metadata TEXT, -- JSON with additional payment info
  created_at TEXT NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

  -- Partner application link
  intake_form_id TEXT -- Link to intake form submission if applicable
);

CREATE INDEX IF NOT EXISTS idx_partner_payments_email ON partner_payments(email);
CREATE INDEX IF NOT EXISTS idx_partner_payments_customer ON partner_payments(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_partner_payments_status ON partner_payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_partner_payments_type ON partner_payments(partnership_type);

-- Stripe customers (partners who have paid or started checkout)
CREATE TABLE IF NOT EXISTS stripe_customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  organization_name TEXT NOT NULL,
  stripe_customer_id TEXT NOT NULL UNIQUE,

  -- Contact info
  phone TEXT,
  city TEXT,

  -- Subscription status
  has_active_subscription INTEGER DEFAULT 0,
  subscription_ends_at TEXT,

  -- Metadata
  customer_metadata TEXT, -- JSON
  created_at TEXT NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stripe_customers_email ON stripe_customers(email);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_stripe_id ON stripe_customers(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_active ON stripe_customers(has_active_subscription);

-- Stripe webhook events log (for debugging and audit)
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  event_data TEXT NOT NULL, -- JSON of full event
  processed INTEGER DEFAULT 0,
  processing_error TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON stripe_webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON stripe_webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created ON stripe_webhook_events(created_at);

-- Partnership activations (when payment succeeds and partnership goes live)
CREATE TABLE IF NOT EXISTS partnership_activations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Partner info
  email TEXT NOT NULL,
  organization_name TEXT NOT NULL,
  partnership_type TEXT NOT NULL,
  partnership_tier TEXT NOT NULL,

  -- Payment reference
  partner_payment_id INTEGER NOT NULL,
  stripe_customer_id TEXT NOT NULL,

  -- Partnership period
  starts_at TEXT NOT NULL,
  ends_at TEXT, -- NULL for one-time, date for subscriptions
  is_active INTEGER DEFAULT 1,

  -- Benefits tracking
  challenges_remaining INTEGER, -- for tiered plans
  challenges_used INTEGER DEFAULT 0,

  -- Metadata
  activation_metadata TEXT, -- JSON
  created_at TEXT NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (partner_payment_id) REFERENCES partner_payments(id)
);

CREATE INDEX IF NOT EXISTS idx_activations_email ON partnership_activations(email);
CREATE INDEX IF NOT EXISTS idx_activations_customer ON partnership_activations(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_activations_active ON partnership_activations(is_active);
CREATE INDEX IF NOT EXISTS idx_activations_type ON partnership_activations(partnership_type);
CREATE INDEX IF NOT EXISTS idx_activations_ends ON partnership_activations(ends_at);
