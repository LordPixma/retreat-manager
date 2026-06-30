/* Retreat program / schedule, managed by admins and shown in the attendee
   portal. Replaces the previously hardcoded schedule block in
   attendee-dashboard.html. Items are grouped by day_label for display and
   ordered by sort_order (gaps of 10 leave room to insert between items).

   No semicolons anywhere in this comment block. wrangler/D1 splits migrations
   on the semicolon, so one inside a comment breaks the apply. */

CREATE TABLE IF NOT EXISTS program_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  day_label TEXT NOT NULL,
  time_label TEXT,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_program_items_sort ON program_items(sort_order);

INSERT INTO program_items (day_label, time_label, title, sort_order) VALUES
  ('Fri, July 31', '3:00 PM', 'Arrival & Registration', 10),
  ('Fri, July 31', '5:00 PM', 'Welcome Session', 20),
  ('Fri, July 31', '6:30 PM', 'Dinner', 30),
  ('Fri, July 31', '8:00 PM', 'Evening Worship', 40),
  ('Sat, August 1', '8:00 AM', 'Breakfast', 50),
  ('Sat, August 1', '9:30 AM', 'Morning Session', 60),
  ('Sat, August 1', '12:30 PM', 'Lunch', 70),
  ('Sat, August 1', '2:00 PM', 'Workshops & Activities', 80),
  ('Sat, August 1', '5:00 PM', 'Free Time', 90),
  ('Sat, August 1', '6:30 PM', 'Dinner', 100),
  ('Sat, August 1', '8:00 PM', 'Evening Programme', 110),
  ('Sun, August 2', '8:00 AM', 'Breakfast', 120),
  ('Sun, August 2', '9:30 AM', 'Final Session', 130),
  ('Sun, August 2', '12:00 PM', 'Lunch & Departure', 140);
