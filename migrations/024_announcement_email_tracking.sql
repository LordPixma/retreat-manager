/* Track which announcements have been emailed to attendees.

   functions/api/admin/announcements/[id]/email.ts marks an announcement
   email_sent = 1 with email_sent_at = CURRENT_TIMESTAMP after sending, but
   migration 016 (which creates the announcements table) never added those
   columns. A database lacking them fails when an announcement is emailed.
   This adds them.

   Unlike the registrations.payment_option gap (folded into 007 because 008
   depends on it), nothing reads these columns at migration time, so a new
   migration is the right home.

   PRODUCTION NOTE: if these columns were already added to prod by hand,
   applying this migration there fails with a duplicate-column error. In that
   case record it as already-applied instead, by adding the file name to
   scripts/baseline-d1-migrations.sql. See migrations/README.md, section
   "Known limitation: the 001-023 history is not cleanly re-appliable".

   IMPORTANT: no semicolons anywhere in this comment block. wrangler/D1 splits
   migrations on the semicolon, so a semicolon inside a comment splits the file
   mid-comment and the apply fails with "SQL code did not contain a statement".
   Block comments only, one ALTER per statement. */

ALTER TABLE announcements ADD COLUMN email_sent INTEGER NOT NULL DEFAULT 0;
ALTER TABLE announcements ADD COLUMN email_sent_at DATETIME;
