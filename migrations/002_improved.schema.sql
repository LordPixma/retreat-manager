-- migrations/002_improved_schema.sql
-- Enhanced database schema with proper indexes and constraints

-- Drop existing tables if they exist (for clean migration)
-- Note: Only use this in development. In production, use ALTER TABLE statements
DROP TABLE IF EXISTS attendees;
DROP TABLE IF EXISTS rooms;  
DROP TABLE IF EXISTS groups;

-- Create groups table with improved structure
CREATE TABLE groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  max_members INTEGER DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create rooms table with improved structure
CREATE TABLE rooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number TEXT NOT NULL UNIQUE,
  description TEXT,
  capacity INTEGER DEFAULT 1,
  floor TEXT,
  room_type TEXT DEFAULT 'standard',
  amenities TEXT, -- JSON string for room amenities
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create attendees table with improved structure
CREATE TABLE attendees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ref_number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  phone TEXT,
  emergency_contact TEXT,
  dietary_requirements TEXT,
  room_id INTEGER,
  group_id INTEGER,
  payment_due REAL DEFAULT 0.00,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'overdue')),
  check_in_date DATE,
  check_out_date DATE,
  special_requests TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL,
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL
);

-- Create indexes for better query performance
CREATE INDEX idx_attendees_ref_number ON attendees(ref_number);
CREATE INDEX idx_attendees_email ON attendees(email);
CREATE INDEX idx_attendees_room_id ON attendees(room_id);
CREATE INDEX idx_attendees_group_id ON attendees(group_id);
CREATE INDEX idx_attendees_payment_status ON attendees(payment_status);
CREATE INDEX idx_attendees_name ON attendees(name);
CREATE INDEX idx_rooms_number ON rooms(number);
CREATE INDEX idx_groups_name ON groups(name);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_attendees_timestamp 
AFTER UPDATE ON attendees
BEGIN
  UPDATE attendees SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_rooms_timestamp 
AFTER UPDATE ON rooms
BEGIN
  UPDATE rooms SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_groups_timestamp 
AFTER UPDATE ON groups
BEGIN
  UPDATE groups SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Insert some sample data for testing
INSERT INTO groups (name, description, max_members) VALUES 
  ('VIP Group', 'Premium attendees with special privileges', 10),
  ('Workshop A', 'Morning workshop participants', 20),
  ('Workshop B', 'Afternoon workshop participants', 20),
  ('Family Group', 'Families with children', 15);

INSERT INTO rooms (number, description, capacity, floor, room_type) VALUES 
  ('101', 'Single room with mountain view', 1, '1st Floor', 'single'),
  ('102', 'Single room with garden view', 1, '1st Floor', 'single'),
  ('201', 'Double room with balcony', 2, '2nd Floor', 'double'),
  ('202', 'Double room with mountain view', 2, '2nd Floor', 'double'),
  ('301', 'Suite with living area', 4, '3rd Floor', 'suite'),
  ('302', 'Family room with bunk beds', 4, '3rd Floor', 'family');

-- Sample attendees with hashed passwords (using standardized format)
-- Note: These passwords are hashed versions of 'password123' using the new hashing method
INSERT INTO attendees (ref_number, name, email, password_hash, room_id, group_id, payment_due, payment_status) VALUES 
  ('REF001', 'John Smith', 'john.smith@example.com', '$retreat$8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 1, 1, 0.00, 'paid'),
  ('REF002', 'Sarah Johnson', 'sarah.j@example.com', '$retreat$8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 2, 1, 150.00, 'pending'),
  ('REF003', 'Mike Davis', 'mike.davis@example.com', '$retreat$8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 3, 2, 75.50, 'partial'),
  ('REF004', 'Emily Brown', 'emily.brown@example.com', '$retreat$8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 3, 2, 200.00, 'pending'),
  ('REF005', 'David Wilson', 'david.w@example.com', '$retreat$8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', NULL, 3, 300.00, 'overdue');

-- Create a view for easy attendee reporting
CREATE VIEW attendee_summary AS
SELECT 
  a.id,
  a.ref_number,
  a.name,
  a.email,
  a.payment_due,
  a.payment_status,
  r.number AS room_number,
  r.description AS room_description,
  g.name AS group_name,
  CASE 
    WHEN a.payment_due <= 0 THEN 'Fully Paid'
    WHEN a.payment_status = 'overdue' THEN 'Overdue'
    WHEN a.payment_status = 'partial' THEN 'Partially Paid'
    ELSE 'Payment Pending'
  END AS payment_summary
FROM attendees a
LEFT JOIN rooms r ON a.room_id = r.id
LEFT JOIN groups g ON a.group_id = g.id;

-- Create a view for room occupancy
CREATE VIEW room_occupancy AS
SELECT 
  r.id,
  r.number,
  r.description,
  r.capacity,
  COUNT(a.id) AS current_occupants,
  r.capacity - COUNT(a.id) AS available_spaces,
  CASE 
    WHEN COUNT(a.id) = 0 THEN 'Empty'
    WHEN COUNT(a.id) < r.capacity THEN 'Available'
    ELSE 'Full'
  END AS status
FROM rooms r
LEFT JOIN attendees a ON r.id = a.room_id
GROUP BY r.id, r.number, r.description, r.capacity;

-- Create a view for group membership
CREATE VIEW group_membership AS
SELECT 
  g.id,
  g.name,
  g.description,
  g.max_members,
  COUNT(a.id) AS current_members,
  COALESCE(g.max_members - COUNT(a.id), 999) AS available_spots,
  GROUP_CONCAT(a.name, ', ') AS member_names
FROM groups g
LEFT JOIN attendees a ON g.id = a.group_id
GROUP BY g.id, g.name, g.description, g.max_members;

-- Migration to update existing data (if migrating from old schema)
-- These would be used instead of DROP/CREATE in production

/*
-- Add new columns to existing tables
ALTER TABLE attendees ADD COLUMN phone TEXT;
ALTER TABLE attendees ADD COLUMN emergency_contact TEXT;
ALTER TABLE attendees ADD COLUMN dietary_requirements TEXT;
ALTER TABLE attendees ADD COLUMN payment_status TEXT DEFAULT 'pending';
ALTER TABLE attendees ADD COLUMN check_in_date DATE;
ALTER TABLE attendees ADD COLUMN check_out_date DATE;
ALTER TABLE attendees ADD COLUMN special_requests TEXT;
ALTER TABLE attendees ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE attendees ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE rooms ADD COLUMN capacity INTEGER DEFAULT 1;
ALTER TABLE rooms ADD COLUMN floor TEXT;
ALTER TABLE rooms ADD COLUMN room_type TEXT DEFAULT 'standard';
ALTER TABLE rooms ADD COLUMN amenities TEXT;
ALTER TABLE rooms ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE rooms ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE groups ADD COLUMN description TEXT;
ALTER TABLE groups ADD COLUMN max_members INTEGER DEFAULT NULL;
ALTER TABLE groups ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE groups ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;

-- Update payment status based on payment_due
UPDATE attendees SET payment_status = 'paid' WHERE payment_due <= 0;
UPDATE attendees SET payment_status = 'pending' WHERE payment_due > 0;
*/