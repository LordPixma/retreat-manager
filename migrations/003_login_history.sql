-- migrations/003_login_history.sql
-- Add login_history table and last_login column

CREATE TABLE IF NOT EXISTS login_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_type TEXT NOT NULL CHECK (user_type IN ('attendee','admin')),
  user_id TEXT NOT NULL,
  login_time DATETIME DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE attendees ADD COLUMN last_login DATETIME;
