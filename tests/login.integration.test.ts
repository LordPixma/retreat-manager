import { describe, it, expect, beforeEach } from 'vitest';
import { onRequestPost as login } from '../functions/api/login.js';
import { setupDb, seedAttendee, jsonRequest, ctx } from './helpers/db.js';

async function callLogin(body) {
  const res = await login(ctx(jsonRequest(body)));
  const json = await res.json();
  return { status: res.status, json };
}

describe('POST /api/login', () => {
  beforeEach(async () => {
    await setupDb();
    await seedAttendee({ ref: 'REF260001', name: 'Sarah Johnson', password: 'Password123' });
  });

  it('logs in with the exact reference number', async () => {
    const { status, json } = await callLogin({ ref: 'REF260001', password: 'Password123' });
    expect(status).toBe(200);
    expect(typeof json.token).toBe('string');
    expect(json.token.length).toBeGreaterThan(10);
  });

  it('is case-insensitive on the reference number', async () => {
    const lower = await callLogin({ ref: 'ref260001', password: 'Password123' });
    expect(lower.status).toBe(200);
    expect(lower.json.token).toBeTruthy();

    const mixed = await callLogin({ ref: 'ReF260001', password: 'Password123' });
    expect(mixed.status).toBe(200);
    expect(mixed.json.token).toBeTruthy();
  });

  it('trims surrounding whitespace on the reference number', async () => {
    const { status, json } = await callLogin({ ref: '  ref260001  ', password: 'Password123' });
    expect(status).toBe(200);
    expect(json.token).toBeTruthy();
  });

  it('rejects a wrong password', async () => {
    const { status, json } = await callLogin({ ref: 'REF260001', password: 'wrong' });
    expect(status).toBe(401);
    expect(json.token).toBeUndefined();
  });

  it('rejects an unknown reference number', async () => {
    const { status } = await callLogin({ ref: 'REF999999', password: 'Password123' });
    expect(status).toBe(401);
  });

  it('records the failed-attempt identifier upper-cased (case normalised)', async () => {
    await callLogin({ ref: 'ref260001', password: 'wrong' });
    const { env } = await import('cloudflare:test');
    const row = await env.DB.prepare(
      "SELECT identifier FROM login_attempts WHERE success = 0 ORDER BY id DESC LIMIT 1"
    ).first();
    expect(row.identifier).toBe('REF260001');
  });

  it('blocks token issuance for legacy accounts needing a reset', async () => {
    await seedAttendee({ ref: 'REF260002', password: 'Password123', must_reset: true });
    const { status, json } = await callLogin({ ref: 'ref260002', password: 'Password123' });
    expect(status).toBe(403);
    expect(json.reset_required).toBe(true);
    expect(json.token).toBeUndefined();
  });

  it('issues a token whose ref resolves the attendee (canonical case)', async () => {
    const { json } = await callLogin({ ref: 'ref260001', password: 'Password123' });
    // /api/me should accept the token and return the attendee.
    const { onRequestGet: me } = await import('../functions/api/me.js');
    const { methodRequest, bearer } = await import('./helpers/db.js');
    const res = await me(ctx(methodRequest('GET', bearer(json.token))));
    const meJson = await res.json();
    expect(res.status).toBe(200);
    expect(meJson.ref_number).toBe('REF260001');
    expect(meJson.name).toBe('Sarah Johnson');
  });
});
