-- Backfill date_of_birth on attendees from registrations.family_members.
--
-- 012 deliberately skipped this because attendees have no FK to their
-- originating registration, so the only available join key is `name` against
-- `family_members[].name` — which can mis-assign DOBs when two registrations
-- contain a member with the same exact name. Trade-off accepted to populate
-- Age for the basic export. Worst case: an admin corrects a wrong DOB by hand.
--
-- Match rules:
--   * case-insensitive, whitespace-trimmed name comparison
--   * skip family_members rows with empty/missing date_of_birth
--   * only update attendees whose date_of_birth is still NULL (idempotent)
--   * LIMIT 1 — first JSON match wins on name collisions

UPDATE attendees
SET date_of_birth = (
  SELECT json_extract(je.value, '$.date_of_birth')
  FROM registrations r, json_each(r.family_members) je
  WHERE r.family_members IS NOT NULL
    AND r.family_members != ''
    AND lower(trim(json_extract(je.value, '$.name'))) = lower(trim(attendees.name))
    AND json_extract(je.value, '$.date_of_birth') IS NOT NULL
    AND json_extract(je.value, '$.date_of_birth') != ''
  LIMIT 1
)
WHERE date_of_birth IS NULL;
