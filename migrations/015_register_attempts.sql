-- Per-IP throttle for the public /api/register endpoint.
-- The login_attempts table can't be reused because its user_type CHECK
-- constraint forbids non-login values, and adding a column there would
-- conflate two distinct rate-limit windows.

CREATE TABLE IF NOT EXISTS register_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip_address TEXT NOT NULL,
  email TEXT,
  attempt_time INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_register_attempts_ip
  ON register_attempts (ip_address, attempt_time);

CREATE INDEX IF NOT EXISTS idx_register_attempts_cleanup
  ON register_attempts (attempt_time);
