/* Community wall — attendees post prayer requests, praise reports and short
   notes that everyone at the retreat can read. Lightweight and additive.

   post_type is one of prayer, praise or note (validated in the API, stored as
   text). is_hidden lets an admin soft-moderate a post without deleting it.
   attendee_id is SET NULL on attendee delete so a removed attendee doesn't take
   their encouragements with them, while author_name is denormalised so the
   wall still shows who wrote it.

   No semicolons anywhere in this comment block. wrangler/D1 splits migrations
   on the semicolon, so one inside a comment breaks the apply. */

CREATE TABLE IF NOT EXISTS community_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  attendee_id INTEGER,
  author_name TEXT NOT NULL,
  post_type TEXT NOT NULL DEFAULT 'note',
  content TEXT NOT NULL,
  is_hidden INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (attendee_id) REFERENCES attendees(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_community_posts_created ON community_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_community_posts_visible ON community_posts(is_hidden, created_at);
