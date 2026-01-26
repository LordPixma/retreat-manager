-- migrations/005_performance_indexes.sql
-- Add performance indexes and constraints

-- Announcements table indexes (if not exists)
CREATE INDEX IF NOT EXISTS idx_announcements_type ON announcements(type);
CREATE INDEX IF NOT EXISTS idx_announcements_is_active ON announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_priority ON announcements(priority);
CREATE INDEX IF NOT EXISTS idx_announcements_target_audience ON announcements(target_audience);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at);
CREATE INDEX IF NOT EXISTS idx_announcements_expires_at ON announcements(expires_at);

-- Login attempts indexes for rate limiting queries
CREATE INDEX IF NOT EXISTS idx_login_attempts_identifier_type ON login_attempts(identifier, user_type);
CREATE INDEX IF NOT EXISTS idx_login_attempts_cleanup ON login_attempts(attempt_time);

-- Login history indexes
CREATE INDEX IF NOT EXISTS idx_login_history_user ON login_history(user_type, user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_time ON login_history(login_time);

-- Compound indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_attendees_group_email ON attendees(group_id, email);
CREATE INDEX IF NOT EXISTS idx_attendees_room_name ON attendees(room_id, name);
CREATE INDEX IF NOT EXISTS idx_attendees_payment ON attendees(payment_status, payment_due);

-- Add updated_at trigger for announcements if not exists
CREATE TRIGGER IF NOT EXISTS update_announcements_timestamp
AFTER UPDATE ON announcements
BEGIN
  UPDATE announcements SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
