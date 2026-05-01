/*
  Allergy / medical registry for attendees.

  Adds:
    * `attendees.registration_id` FK so we can find the family's primary
      contact when sending allergy-form emails for under-16s.
    * `allergy_records` table — one row per attendee, holding the form
      submission state and the captured details. History is flat (no
      versioning); admins re-issue a form to overwrite.

  Backfill:
    * Primary attendees are matched to their registration via email (the
      approval flow stores registration.email on the primary attendee only).
    * Non-primary family members can't be reliably linked from existing data
      (no email, name collisions across families). They keep registration_id
      NULL; the email-distribution code falls back to using the attendee's
      own email when present, otherwise skips with a logged warning. Future
      approvals populate the FK directly.

  Block comments (not -- line comments) are used throughout because the
  Cloudflare D1 web console sometimes collapses pasted SQL onto fewer lines,
  and a -- comment then swallows the rest of the statement.
*/

ALTER TABLE attendees ADD COLUMN registration_id INTEGER REFERENCES registrations(id) ON DELETE SET NULL;

UPDATE attendees
SET registration_id = (
  SELECT r.id FROM registrations r
  WHERE r.email IS NOT NULL
    AND lower(r.email) = lower(attendees.email)
  LIMIT 1
)
WHERE registration_id IS NULL AND email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_attendees_registration_id ON attendees(registration_id);

/*
  status meanings:
    pending    — form has been emailed, no response yet
    submitted  — recipient submitted at least once and reported allergies
    none       — recipient explicitly declared no allergies
*/
CREATE TABLE IF NOT EXISTS allergy_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  attendee_id INTEGER NOT NULL UNIQUE REFERENCES attendees(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','submitted','none')),
  has_allergies INTEGER NOT NULL DEFAULT 0,
  allergens TEXT,
  severity TEXT CHECK (severity IN ('mild','moderate','severe') OR severity IS NULL),
  epipen_required INTEGER NOT NULL DEFAULT 0,
  emergency_notes TEXT,
  submitted_by_email TEXT,
  submitted_at DATETIME,
  form_sent_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_allergy_records_status ON allergy_records(status);
CREATE INDEX IF NOT EXISTS idx_allergy_records_severity ON allergy_records(severity)
  WHERE severity IS NOT NULL;
