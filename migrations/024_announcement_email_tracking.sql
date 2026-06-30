/* Track which announcements have been emailed to attendees.

   functions/api/admin/announcements/[id]/email.ts marks an announcement
   with `email_sent = 1, email_sent_at = CURRENT_TIMESTAMP` after sending,
   but migration 016 (which creates the announcements table) never added
   those columns. A database built purely from migrations therefore 500s on
   that endpoint, and a from-scratch build is missing them. This adds them.

   Unlike the registrations.payment_option fix (folded into 007 because 008
   depends on it), nothing reads these columns at migration time, so a new
   migration is the right home.

   PRODUCTION NOTE: if these columns were already added to prod by hand,
   applying this migration there will fail with "duplicate column name". In
   that case record it as already-applied instead of running it — add
   '024_announcement_email_tracking.sql' to scripts/baseline-d1-migrations.sql.
   Check first with:
     SELECT name FROM pragma_table_info('announcements')
     WHERE name IN ('email_sent','email_sent_at');
   See migrations/README.md ("Reconciling pre-existing schema drift").

   Block comments only, one ALTER per statement — D1-console safe. */

ALTER TABLE announcements ADD COLUMN email_sent INTEGER NOT NULL DEFAULT 0;
ALTER TABLE announcements ADD COLUMN email_sent_at DATETIME;
