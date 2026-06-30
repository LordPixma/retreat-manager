/* Mandatory-attendance flag for program items. Sessions flagged mandatory are
   highlighted on the admin board and the attendee schedule so everyone knows
   which parts of the retreat are required rather than optional.

   Stored as an integer 0/1 (SQLite has no native boolean). NOT NULL with a
   default of 0 so every existing row is "optional" until an admin marks it.

   No semicolons anywhere in this comment block. wrangler/D1 splits migrations
   on the semicolon, so one inside a comment breaks the apply. */

ALTER TABLE program_items ADD COLUMN is_mandatory INTEGER NOT NULL DEFAULT 0;
