/* Flexible payment plans — parallel system to legacy installment_schedules.

   Per-row scheduling so attendees pick any N months, pay any row at any
   time by card or bank transfer, and the cron knows what it has already
   reminded. Legacy 3/4-installment flow in 009_payments.sql untouched.

   IMPORTANT — D1 dashboard SQL console limitation:
   The console splits multi-statement input on `;` naively. Both
   `-- ... ;` line comments AND `/* ... ; ... */` block comments
   containing a semicolon break parsing. All inline comments in this
   file are therefore semicolon-free. When applying via the dashboard
   paste statements one at a time; the triggers must be pasted alone
   because of their `BEGIN ... ; END;` body. */

CREATE TABLE IF NOT EXISTS flexible_payment_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  attendee_id INTEGER NOT NULL,
  total_amount INTEGER NOT NULL,
  months_count INTEGER NOT NULL,
  start_date TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  reminders_enabled INTEGER DEFAULT 1,
  reminder_days_before INTEGER DEFAULT 3,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  cancelled_at DATETIME,
  FOREIGN KEY (attendee_id) REFERENCES attendees(id) ON DELETE CASCADE
);

/* total_amount, months_count and reminder_days_before are pence,
   2..36, and 1..14 respectively — bounds enforced in code, not SQL,
   because SQLite's CHECK with constants doesn't help future schema
   migrations. amount on a single installment row may differ by 1p
   between rows to absorb integer-division rounding so the rows sum
   exactly equals total_amount. */

CREATE TABLE IF NOT EXISTS flexible_installments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_id INTEGER NOT NULL,
  installment_number INTEGER NOT NULL,
  due_date TEXT NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'pending_bank', 'paid', 'overdue', 'cancelled')),
  payment_method TEXT CHECK (payment_method IN ('card', 'bank_transfer')),
  stripe_checkout_session_id TEXT,
  stripe_payment_intent_id TEXT,
  paid_at DATETIME,
  last_reminder_sent_at DATETIME,
  bank_transfer_reference TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plan_id) REFERENCES flexible_payment_plans(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_flex_plans_attendee ON flexible_payment_plans(attendee_id);
CREATE INDEX IF NOT EXISTS idx_flex_plans_status ON flexible_payment_plans(status);
CREATE INDEX IF NOT EXISTS idx_flex_installments_plan ON flexible_installments(plan_id);
CREATE INDEX IF NOT EXISTS idx_flex_installments_due ON flexible_installments(due_date);
CREATE INDEX IF NOT EXISTS idx_flex_installments_status ON flexible_installments(status);
CREATE INDEX IF NOT EXISTS idx_flex_installments_stripe_session ON flexible_installments(stripe_checkout_session_id);

CREATE TRIGGER IF NOT EXISTS update_flexible_payment_plans_timestamp
AFTER UPDATE ON flexible_payment_plans
BEGIN
  UPDATE flexible_payment_plans SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_flexible_installments_timestamp
AFTER UPDATE ON flexible_installments
BEGIN
  UPDATE flexible_installments SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
