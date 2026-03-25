-- Audit log for admin actions
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_user TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id INTEGER,
  details TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);

-- Soft delete and check-in fields on attendees
ALTER TABLE attendees ADD COLUMN is_archived INTEGER DEFAULT 0;
ALTER TABLE attendees ADD COLUMN checked_in INTEGER DEFAULT 0;
ALTER TABLE attendees ADD COLUMN checked_in_at DATETIME;

CREATE INDEX IF NOT EXISTS idx_attendees_archived ON attendees(is_archived);
CREATE INDEX IF NOT EXISTS idx_attendees_checked_in ON attendees(checked_in);
