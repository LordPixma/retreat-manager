/*
  ONE-TIME baseline for adopting wrangler-managed D1 migrations on a database
  whose 001..023 migrations were already applied by hand.

  It creates the d1_migrations bookkeeping table (same shape wrangler creates)
  and records every existing migration as already-applied, so the very first
  `wrangler d1 migrations apply` runs ONLY genuinely-new files (024+) instead of
  re-running everything — most importantly NOT re-running 002's DROP TABLE.

  Run this ONCE against production, AFTER confirming all 23 files below are
  truly applied (in particular 023 — verify its 7 columns exist on `attendees`).
  Re-running is harmless: INSERT OR IGNORE skips names already present.

    npx wrangler d1 execute attendance_db --remote --file=./scripts/baseline-d1-migrations.sql

  This file lives outside migrations/ on purpose so wrangler never treats it as
  a migration.
*/

CREATE TABLE IF NOT EXISTS d1_migrations (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT UNIQUE,
  applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO d1_migrations (name) VALUES
  ('001_schema.sql'),
  ('002_improved.schema.sql'),
  ('003_login_history.sql'),
  ('004_login_attempts.sql'),
  ('005_performance_indexes.sql'),
  ('006_registrations.sql'),
  ('007_family_registration.sql'),
  ('008_attendee_payment_option.sql'),
  ('009_payments.sql'),
  ('010_activity_teams.sql'),
  ('011_enhancements.sql'),
  ('012_attendee_personal_details.sql'),
  ('013_backfill_attendee_dob.sql'),
  ('014_force_legacy_password_reset.sql'),
  ('015_register_attempts.sql'),
  ('016_create_announcements_and_normalise_archive.sql'),
  ('017_room_cot_capacity.sql'),
  ('018_settings_table.sql'),
  ('019_allergy_registry.sql'),
  ('020_admins_table.sql'),
  ('021_flexible_payment_plans.sql'),
  ('022_group_lead.sql'),
  ('023_attendee_personal_details_expansion.sql');
