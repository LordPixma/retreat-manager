-- Personal-details fields on attendees: first_name, last_name, date_of_birth.
-- Used by the "Attendees (Basic)" CSV export (First name, Last name, Age) and
-- propagated from registration approval going forward.
--
-- Backfill notes:
--  * first_name/last_name are derived from the existing single `name` column
--    by splitting on the first whitespace run.
--  * date_of_birth is NOT backfilled: attendees have no FK back to the
--    originating registration, so a name-only match against
--    registrations.family_members would mis-assign DOBs across families with
--    duplicate first names. Legacy rows can be edited by an admin.

ALTER TABLE attendees ADD COLUMN first_name TEXT;
ALTER TABLE attendees ADD COLUMN last_name TEXT;
ALTER TABLE attendees ADD COLUMN date_of_birth DATE;

UPDATE attendees
SET
  first_name = CASE
    WHEN instr(trim(name), ' ') > 0
      THEN substr(trim(name), 1, instr(trim(name), ' ') - 1)
    ELSE trim(name)
  END,
  last_name = CASE
    WHEN instr(trim(name), ' ') > 0
      THEN trim(substr(trim(name), instr(trim(name), ' ') + 1))
    ELSE NULL
  END
WHERE first_name IS NULL AND name IS NOT NULL AND trim(name) != '';
