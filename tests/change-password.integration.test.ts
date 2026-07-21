import { describe, it, expect, beforeEach } from 'vitest';
import { onRequestPost as login } from '../functions/api/login.js';
import { onRequestPost as changePassword } from '../functions/api/change-password.js';
import { setupDb, seedAttendee, jsonRequest, ctx } from './helpers/db.js';

async function callLogin(body) {
  const res = await login(ctx(jsonRequest(body)));
  return { status: res.status, json: await res.json() };
}

async function callChange(body) {
  const res = await changePassword(ctx(jsonRequest(body)));
  return { status: res.status, json: await res.json() };
}

// Exercises the forced-reset journey the attendee login UI drives: an attendee
// who was emailed a temporary password (must_reset_password = 1) is bounced
// with 403 reset_required, sets a new password via /api/change-password, then
// logs in normally. Regression guard for the "HTTP 403:" login breakage.
describe('POST /api/change-password (attendee forced reset)', () => {
  beforeEach(async () => {
    await setupDb();
    await seedAttendee({ ref: 'REF260024', name: 'Idikibiebuma Ogan', password: 'TempPass123', must_reset: true });
  });

  it('completes the full temp-password -> set-new-password -> login journey', async () => {
    // 1. Temp password is correct but login refuses to issue a token.
    const gated = await callLogin({ ref: 'REF260024', password: 'TempPass123' });
    expect(gated.status).toBe(403);
    expect(gated.json.reset_required).toBe(true);
    expect(gated.json.token).toBeUndefined();

    // 2. Attendee sets their own password (case-insensitive ref, as UI sends it).
    const changed = await callChange({
      ref: 'ref260024',
      current_password: 'TempPass123',
      new_password: 'MyNewPass456',
    });
    expect(changed.status).toBe(200);
    expect(changed.json.success).toBe(true);

    // 3. The reset flag is cleared and the new password now yields a token.
    const ok = await callLogin({ ref: 'REF260024', password: 'MyNewPass456' });
    expect(ok.status).toBe(200);
    expect(typeof ok.json.token).toBe('string');
    expect(ok.json.token.length).toBeGreaterThan(10);

    // The old temp password no longer works.
    const stale = await callLogin({ ref: 'REF260024', password: 'TempPass123' });
    expect(stale.status).toBe(401);
  });

  it('rejects a wrong current (temp) password', async () => {
    const { status } = await callChange({
      ref: 'REF260024',
      current_password: 'WrongTemp999',
      new_password: 'MyNewPass456',
    });
    expect(status).toBe(401);
  });

  it('rejects a new password shorter than 8 characters', async () => {
    const { status } = await callChange({
      ref: 'REF260024',
      current_password: 'TempPass123',
      new_password: 'short',
    });
    expect(status).toBe(400);
  });

  it('rejects reusing the temporary password as the new password', async () => {
    const { status } = await callChange({
      ref: 'REF260024',
      current_password: 'TempPass123',
      new_password: 'TempPass123',
    });
    expect(status).toBe(400);
  });

  it('rejects an unknown reference number', async () => {
    const { status } = await callChange({
      ref: 'REF999999',
      current_password: 'TempPass123',
      new_password: 'MyNewPass456',
    });
    expect(status).toBe(401);
  });
});
