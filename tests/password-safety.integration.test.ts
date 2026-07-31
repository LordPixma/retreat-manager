import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import { onRequestPut as putAttendee } from '../functions/api/admin/attendees/[id].js';
import { onRequestPost as resetPw } from '../functions/api/admin/attendees/[id]/reset-password.js';
import { onRequestPost as forgot } from '../functions/api/forgot-password.js';
import { onRequestPost as login } from '../functions/api/login.js';
import { setupDb, seedAttendee, jsonRequest, adminBearer, ctx } from './helpers/db.js';

async function loginStatus(ref: string, password: string) {
  const res = await login(ctx(jsonRequest({ ref, password })));
  return { status: res.status, json: await res.json() as any };
}

describe('password safety', () => {
  let id: number;

  beforeEach(async () => {
    await setupDb();
    id = await seedAttendee({ ref: 'REF-P1', name: 'Pat Person', password: 'Password123', email: 'pat@example.com' });
  });

  // The reported bug: editing a profile reset the password.
  it('a profile edit never changes the password (even if a password is sent)', async () => {
    const res = await putAttendee(ctx(
      jsonRequest({ name: 'Renamed Person', password: 'InjectedPass9' }, await adminBearer()),
      { id: String(id) },
    ));
    expect(res.status).toBe(200);

    // Profile field updated…
    const row = await env.DB.prepare('SELECT name FROM attendees WHERE id = ?').bind(id).first();
    expect(row!.name).toBe('Renamed Person');

    // …but the original password still works and the injected one does not.
    expect((await loginStatus('REF-P1', 'Password123')).status).toBe(200);
    expect((await loginStatus('REF-P1', 'InjectedPass9')).status).toBe(401);
  });

  describe('admin reset-password', () => {
    it('generates a temp password and forces a reset on next login', async () => {
      const res = await resetPw(ctx(jsonRequest({ notify: false }, await adminBearer()), { id: String(id) }));
      const body = await res.json() as any;
      expect(res.status).toBe(200);
      expect(body.generated).toBe(true);
      expect(typeof body.temp_password).toBe('string');
      expect(body.temp_password.length).toBeGreaterThanOrEqual(8);

      // Old password dead; temp works but is gated by the forced-reset flow.
      expect((await loginStatus('REF-P1', 'Password123')).status).toBe(401);
      const gated = await loginStatus('REF-P1', body.temp_password);
      expect(gated.status).toBe(403);
      expect(gated.json.reset_required).toBe(true);
    });

    it('accepts an admin-specified password', async () => {
      const res = await resetPw(ctx(jsonRequest({ new_password: 'BrandNewPass1', notify: false }, await adminBearer()), { id: String(id) }));
      const body = await res.json() as any;
      expect(res.status).toBe(200);
      expect(body.generated).toBe(false);
    });

    it('rejects a too-short password', async () => {
      const res = await resetPw(ctx(jsonRequest({ new_password: 'short', notify: false }, await adminBearer()), { id: String(id) }));
      expect(res.status).toBe(400);
    });

    it('requires admin auth', async () => {
      const res = await resetPw(ctx(jsonRequest({ notify: false }), { id: String(id) }));
      expect(res.status).toBe(401);
    });
  });

  describe('forgot-password (self-service)', () => {
    it('requires both reference number and email', async () => {
      const res = await forgot(ctx(jsonRequest({ ref: 'REF-P1' })));
      expect(res.status).toBe(400);
    });

    it('returns a generic success and does not change the password on a non-match', async () => {
      const res = await forgot(ctx(jsonRequest({ ref: 'REF-P1', email: 'wrong@example.com' })));
      expect(res.status).toBe(200);
      expect((await res.json() as any).success).toBe(true);
      // Password untouched.
      expect((await loginStatus('REF-P1', 'Password123')).status).toBe(200);
    });

    it('does not change the password when email delivery is not configured', async () => {
      // env has no RESEND_API_KEY/FROM_EMAIL, so isEmailReady() is false.
      const res = await forgot(ctx(jsonRequest({ ref: 'REF-P1', email: 'pat@example.com' })));
      expect(res.status).toBe(200);
      expect((await loginStatus('REF-P1', 'Password123')).status).toBe(200);
    });

    it('resets the password and forces a reset when ref+email match and email is configured', async () => {
      // Per-call env override so isEmailReady() is true (DB and other bindings
      // resolve through the prototype). sendEmail is best-effort; the reset is
      // applied regardless of delivery.
      const mailEnv = Object.assign(Object.create(env), {
        RESEND_API_KEY: 'test-key',
        FROM_EMAIL: 'noreply@test.local',
      });
      const context = {
        request: jsonRequest({ ref: 'ref-p1', email: 'PAT@example.com' }), // case-insensitive
        env: mailEnv, params: {}, waitUntil: () => {}, next: async () => new Response(), data: {},
      };
      const res = await forgot(context as any);
      expect(res.status).toBe(200);

      // Old password no longer works; account flagged for forced reset.
      expect((await loginStatus('REF-P1', 'Password123')).status).toBe(401);
      const row = await env.DB.prepare('SELECT must_reset_password FROM attendees WHERE ref_number = ?').bind('REF-P1').first();
      expect(row!.must_reset_password).toBe(1);
    });
  });
});
