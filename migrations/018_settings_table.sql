-- Generic key/value settings table for system-wide config that admins can
-- change at runtime (check-in window first, more to follow). Single source of
-- truth so we don't accumulate one-purpose tables for every toggle.

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_by TEXT
);
