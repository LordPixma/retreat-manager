import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import { generateAttendeeToken } from '../functions/_shared/auth.js';
import { onRequestGet as exportData } from '../functions/api/attendee/export.js';
import { setupDb, seedAttendee, methodRequest, bearer, ctx } from './helpers/db.js';

describe('GET /api/attendee/export', () => {
  beforeEach(async () => {
    await setupDb();
  });

  it('requires auth', async () => {
    const res = await exportData(ctx(methodRequest('GET')));
    expect(res.status).toBe(401);
  });

  it('exports the attendee data as a JSON attachment without the password hash', async () => {
    await seedAttendee({ ref: 'REF260001', name: 'Sarah Johnson', email: 'sarah@example.com' });
    const token = await generateAttendeeToken('REF260001', env.JWT_SECRET);
    const res = await exportData(ctx(methodRequest('GET', bearer(token))));

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Disposition')).toContain('attachment');
    expect(res.headers.get('Content-Disposition')).toContain('REF260001');

    const json = await res.json();
    expect(json.profile.ref_number).toBe('REF260001');
    expect(json.profile.name).toBe('Sarah Johnson');
    expect(json.profile.password_hash).toBeUndefined();
    expect(Array.isArray(json.activity_teams)).toBe(true);
    expect(Array.isArray(json.community_posts)).toBe(true);
  });
});
