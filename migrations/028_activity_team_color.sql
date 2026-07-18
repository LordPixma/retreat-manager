/* Per-team accent colour for activity teams. Admins pick a colour when
   creating or editing a team so members can tell teams apart at a glance on
   the attendee dashboard, and the admin table shows a matching swatch.

   Stored as a 7-character hex string (for example 8b5cf6 prefixed with a hash).
   NOT NULL with a sensible default so every existing row gets the brand violet
   until an admin changes it, and inserts that omit the column still succeed.

   No semicolons anywhere in this comment block. wrangler/D1 splits migrations
   on the semicolon, so one inside a comment breaks the apply. */

ALTER TABLE activity_teams ADD COLUMN color TEXT NOT NULL DEFAULT '#8b5cf6';
