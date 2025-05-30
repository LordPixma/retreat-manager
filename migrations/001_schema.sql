-- migrations/001_schema.sql

-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL
);

-- Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number TEXT NOT NULL,
  description TEXT
);

-- Create attendees table
CREATE TABLE IF NOT EXISTS attendees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ref_number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT,
  password_hash TEXT NOT NULL,
  room_id INTEGER,
  group_id INTEGER,
  payment_due REAL DEFAULT 0,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL,
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL
);

-- Optional: seed initial group and room data (modify as needed)
-- INSERT INTO groups (name) VALUES ('Default Group');
-- INSERT INTO rooms (number, description) VALUES ('101', 'Single bed');
