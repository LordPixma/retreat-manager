-- Activity Teams for retreat activities (separate from accommodation groups)

CREATE TABLE IF NOT EXISTS activity_teams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  leader_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (leader_id) REFERENCES attendees(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS activity_team_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id INTEGER NOT NULL,
  attendee_id INTEGER NOT NULL,
  added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES activity_teams(id) ON DELETE CASCADE,
  FOREIGN KEY (attendee_id) REFERENCES attendees(id) ON DELETE CASCADE,
  UNIQUE(team_id, attendee_id)
);

CREATE INDEX IF NOT EXISTS idx_activity_team_members_team ON activity_team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_activity_team_members_attendee ON activity_team_members(attendee_id);
CREATE INDEX IF NOT EXISTS idx_activity_teams_name ON activity_teams(name);

CREATE TRIGGER IF NOT EXISTS update_activity_teams_timestamp
AFTER UPDATE ON activity_teams
BEGIN
  UPDATE activity_teams SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
