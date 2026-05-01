-- Force every attendee whose password is still in the legacy $retreat$
-- (SHA256 + global static salt) format to reset on next login. The legacy
-- format is trivially crackable if the hash leaks, and the previous "lazy
-- upgrade on next successful login" flow left passive accounts vulnerable
-- indefinitely.
--
-- Behaviour: when must_reset_password = 1, /api/login should respond with a
-- 403 + reset URL after verifying the password, instead of returning a token.
-- After the user sets a new password, the verifying code clears the flag.

ALTER TABLE attendees ADD COLUMN must_reset_password INTEGER DEFAULT 0;

UPDATE attendees
SET must_reset_password = 1
WHERE password_hash LIKE '$retreat$%';

CREATE INDEX IF NOT EXISTS idx_attendees_must_reset
  ON attendees(must_reset_password)
  WHERE must_reset_password = 1;
