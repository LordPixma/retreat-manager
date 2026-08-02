// Shared helpers for the annual "Start New Season" archive + reset flow.
//
// The reset keeps staff/admin accounts and app configuration and clears every
// event-specific table. Table discovery is dynamic (from sqlite_master) so the
// list stays correct as the schema evolves — we only ever have to maintain the
// small KEEP set below.

import type { D1Database } from '@cloudflare/workers-types';

// Tables preserved across seasons: admin/staff accounts, key/value app config,
// and the migration bookkeeping table. Everything else is event data and gets
// cleared. sqlite_* and Cloudflare internal (_cf_*) tables are excluded from
// discovery entirely.
export const KEEP_TABLES = ['admins', 'settings', 'd1_migrations'];

// Return the names of all user tables (excluding sqlite/CF-internal tables).
export async function listUserTables(db: D1Database): Promise<string[]> {
  const { results } = await db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type = 'table'
      AND name NOT LIKE 'sqlite_%'
      AND name NOT LIKE '_cf_%'
    ORDER BY name
  `).all();
  return (results as { name: string }[]).map(r => r.name);
}

// Tables that a reset will clear = all user tables minus the KEEP set.
export async function tablesToClear(db: D1Database): Promise<string[]> {
  const all = await listUserTables(db);
  const keep = new Set(KEEP_TABLES);
  return all.filter(t => !keep.has(t));
}
