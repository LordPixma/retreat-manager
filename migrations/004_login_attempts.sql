-- migrations/004_login_attempts.sql
-- Add login_attempts table for rate limiting

CREATE TABLE IF NOT EXISTS login_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  identifier TEXT NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('attendee','admin')),
  success INTEGER NOT NULL DEFAULT 0,
  ip_address TEXT,
  attempt_time INTEGER NOT NULL
);

-- Index for efficient rate limit queries
CREATE INDEX IF NOT EXISTS idx_login_attempts_rate_limit
ON login_attempts (identifier, user_type, attempt_time);

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_login_attempts_time
ON login_attempts (attempt_time);
