/* Web-push subscriptions for attendees who opt into notifications.

   One row per browser/device push subscription. endpoint is unique (the push
   service's URL for that device); p256dh and auth are the subscription's keys.
   attendee_id ties it to the person so we could target later, and is SET NULL
   on attendee delete so an orphaned subscription is simply anonymous until it
   expires. Additive and idempotent.

   No semicolons anywhere in this comment block. wrangler/D1 splits migrations
   on the semicolon, so one inside a comment breaks the apply. */

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  attendee_id INTEGER,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT,
  auth TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (attendee_id) REFERENCES attendees(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_attendee ON push_subscriptions(attendee_id);
