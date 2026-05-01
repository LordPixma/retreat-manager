-- Two unrelated cleanups in one migration:
--
-- 1. Create the announcements table so a fresh local DB can apply migration
--    005 (which adds indexes that reference it). Production already has the
--    table — it must have been created out-of-band (manually via the D1
--    console) — so `IF NOT EXISTS` makes this idempotent there.
--
-- 2. Backfill `attendees.is_archived = NULL` rows to 0. Migration 011 added
--    the column with `DEFAULT 0`, but rows that existed before 011 stayed
--    NULL, leading to inconsistent `WHERE is_archived = 0` filters.

CREATE TABLE IF NOT EXISTS announcements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general',
  priority INTEGER NOT NULL DEFAULT 1,
  target_audience TEXT NOT NULL DEFAULT 'all',
  target_groups TEXT,
  author_name TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  starts_at DATETIME,
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

UPDATE attendees SET is_archived = 0 WHERE is_archived IS NULL;
