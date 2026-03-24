-- Stripe payment integration tables

-- Track all Stripe transactions
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  attendee_id INTEGER NOT NULL,
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_checkout_session_id TEXT,
  stripe_customer_id TEXT,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'gbp',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded', 'cancelled')),
  payment_type TEXT DEFAULT 'full' CHECK (payment_type IN ('full', 'installment')),
  installment_number INTEGER,
  installment_total INTEGER,
  description TEXT,
  paid_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (attendee_id) REFERENCES attendees(id) ON DELETE CASCADE
);

-- Track installment plans
CREATE TABLE IF NOT EXISTS installment_schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  attendee_id INTEGER NOT NULL UNIQUE,
  total_amount INTEGER NOT NULL,
  installment_count INTEGER NOT NULL DEFAULT 3,
  installment_amount INTEGER NOT NULL,
  installments_paid INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  next_due_date TEXT,
  stripe_customer_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (attendee_id) REFERENCES attendees(id) ON DELETE CASCADE
);

-- Add Stripe customer ID to attendees
ALTER TABLE attendees ADD COLUMN stripe_customer_id TEXT;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payments_attendee_id ON payments(attendee_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_pi ON payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_session ON payments(stripe_checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_installment_schedules_attendee ON installment_schedules(attendee_id);
CREATE INDEX IF NOT EXISTS idx_installment_schedules_next_due ON installment_schedules(next_due_date);
CREATE INDEX IF NOT EXISTS idx_attendees_stripe_customer ON attendees(stripe_customer_id);

-- Triggers
CREATE TRIGGER IF NOT EXISTS update_payments_timestamp
AFTER UPDATE ON payments
BEGIN
  UPDATE payments SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_installment_schedules_timestamp
AFTER UPDATE ON installment_schedules
BEGIN
  UPDATE installment_schedules SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
