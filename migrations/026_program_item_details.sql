/* Richer program items: structured date + start/end time (so the admin form
   can use date/time pickers), a named key contact, an event type (which drives
   the display icon), an audience indicator, and a priority. The legacy
   day_label / time_label columns are kept for backward compatibility but the
   new form writes event_date / start_time instead, and the display prefers
   those.

   Existing seeded rows are backfilled from their day_label / time_label.

   No semicolons anywhere in this comment block. wrangler/D1 splits migrations
   on the semicolon, so one inside a comment breaks the apply. One ALTER per
   statement. */

ALTER TABLE program_items ADD COLUMN event_date TEXT;
ALTER TABLE program_items ADD COLUMN start_time TEXT;
ALTER TABLE program_items ADD COLUMN end_time TEXT;
ALTER TABLE program_items ADD COLUMN contact_name TEXT;
ALTER TABLE program_items ADD COLUMN event_type TEXT NOT NULL DEFAULT 'general';
ALTER TABLE program_items ADD COLUMN audience TEXT NOT NULL DEFAULT 'all';
ALTER TABLE program_items ADD COLUMN priority TEXT NOT NULL DEFAULT 'normal';

UPDATE program_items SET event_date = '2026-07-31' WHERE day_label = 'Fri, July 31';
UPDATE program_items SET event_date = '2026-08-01' WHERE day_label = 'Sat, August 1';
UPDATE program_items SET event_date = '2026-08-02' WHERE day_label = 'Sun, August 2';

UPDATE program_items SET start_time = CASE time_label
  WHEN '3:00 PM' THEN '15:00'
  WHEN '5:00 PM' THEN '17:00'
  WHEN '6:30 PM' THEN '18:30'
  WHEN '8:00 PM' THEN '20:00'
  WHEN '8:00 AM' THEN '08:00'
  WHEN '9:30 AM' THEN '09:30'
  WHEN '12:30 PM' THEN '12:30'
  WHEN '2:00 PM' THEN '14:00'
  WHEN '12:00 PM' THEN '12:00'
  ELSE start_time END
WHERE time_label IS NOT NULL;

UPDATE program_items SET event_type = 'meal' WHERE title IN ('Breakfast', 'Lunch', 'Dinner', 'Lunch & Departure');
UPDATE program_items SET event_type = 'worship' WHERE title = 'Evening Worship';
UPDATE program_items SET event_type = 'free' WHERE title = 'Free Time';
UPDATE program_items SET event_type = 'activity' WHERE title = 'Workshops & Activities';
