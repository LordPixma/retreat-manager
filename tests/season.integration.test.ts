import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import { onRequestPost as resetSeason, CONFIRM_PHRASE } from '../functions/api/admin/season/reset.js';
import { onRequestGet as exportSeason } from '../functions/api/admin/season/export.js';
import { setupDb, seedAttendee, jsonRequest, methodRequest, adminBearer, ctx } from './helpers/db.js';

async function seedSome() {
  await seedAttendee({ ref: 'REF-S1', name: 'Someone' });
  await seedAttendee({ ref: 'REF-S2', name: 'Another' });
  await env.DB.prepare('INSERT INTO groups (name) VALUES (?)').bind('Team Alpha').run();
  await env.DB.prepare("INSERT INTO announcements (title, content) VALUES ('Welcome', 'Hi')").run();
  await env.DB.prepare(
    "INSERT INTO admins (username, password_hash, role) VALUES ('super', 'x', 'super_admin')"
  ).run();
  await env.DB.prepare("INSERT INTO settings (key, value) VALUES ('retreat_name', '2026')").run();
}

async function count(table: string): Promise<number> {
  const row = await env.DB.prepare(`SELECT COUNT(*) AS c FROM ${table}`).first();
  return (row!.c as number);
}

describe('season reset', () => {
  beforeEach(async () => {
    await setupDb();
    await seedSome();
  });

  it('requires a super-admin', async () => {
    // Regular admin token
    const asAdmin = await resetSeason(ctx(jsonRequest({ confirm: CONFIRM_PHRASE }, await adminBearer('Reg', 'admin'))));
    expect(asAdmin.status).toBe(403);
    // No token
    const noAuth = await resetSeason(ctx(jsonRequest({ confirm: CONFIRM_PHRASE })));
    expect(noAuth.status).toBe(403);
  });

  it('requires the exact confirmation phrase', async () => {
    const res = await resetSeason(ctx(jsonRequest({ confirm: 'reset' }, await adminBearer())));
    expect(res.status).toBe(400);
    // And nothing was cleared.
    expect(await count('attendees')).toBe(2);
  });

  it('clears event data but keeps admins and settings', async () => {
    expect(await count('attendees')).toBe(2);

    const res = await resetSeason(ctx(jsonRequest({ confirm: CONFIRM_PHRASE }, await adminBearer('Boss', 'super_admin'))));
    const body = await res.json() as any;
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.rows_cleared).toBeGreaterThan(0);
    expect(body.kept).toContain('admins');
    expect(body.kept).toContain('settings');

    // Event tables emptied…
    expect(await count('attendees')).toBe(0);
    expect(await count('groups')).toBe(0);
    expect(await count('announcements')).toBe(0);

    // …preserved tables intact.
    expect(await count('admins')).toBe(1);
    expect(await count('settings')).toBe(1);

    // The reset itself is recorded as the first entry of the new season.
    const audit = await env.DB.prepare("SELECT action FROM audit_log WHERE action = 'season_reset'").first();
    expect(audit).toBeTruthy();
  });
});

describe('season export', () => {
  beforeEach(async () => {
    await setupDb();
    await seedSome();
  });

  it('requires a super-admin', async () => {
    const asAdmin = await exportSeason(ctx(methodRequest('GET', await adminBearer('Reg', 'admin'))));
    expect(asAdmin.status).toBe(403);
  });

  it('returns a full JSON archive of every table', async () => {
    const res = await exportSeason(ctx(methodRequest('GET', await adminBearer())));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('application/json');
    const body = await res.json() as any;
    expect(body._meta.kind).toBe('retreat-portal-full-backup');
    // Seeded rows are present in the dump.
    expect(body.tables.attendees.length).toBe(2);
    expect(body.tables.admins.length).toBe(1);
    expect(body.tables.settings.length).toBe(1);
  });
});
