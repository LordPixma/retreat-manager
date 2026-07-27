import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import { onRequestGet as listGenders, onRequestPost as applyGenders } from '../functions/api/admin/attendees/bulk-gender.js';
import { setupDb, seedAttendee, jsonRequest, methodRequest, adminBearer, ctx } from './helpers/db.js';

describe('bulk-gender endpoints', () => {
  let a1: number, a2: number, a3: number;

  beforeEach(async () => {
    await setupDb();
    a1 = await seedAttendee({ ref: 'REF-1', name: 'Alice' });                    // unset
    a2 = await seedAttendee({ ref: 'REF-2', name: 'Bob', gender: 'male' });       // preset male
    a3 = await seedAttendee({ ref: 'REF-3', name: 'Carol' });                     // unset
  });

  async function listCall() {
    const res = await listGenders(ctx(methodRequest('GET', await adminBearer())));
    return { status: res.status, json: await res.json() as any };
  }
  async function applyCall(body: any) {
    const res = await applyGenders(ctx(jsonRequest(body, await adminBearer())));
    return { status: res.status, json: await res.json() as any };
  }

  it('requires admin auth for both verbs', async () => {
    const g = await listGenders(ctx(methodRequest('GET')));
    expect(g.status).toBe(401);
    const p = await applyGenders(ctx(jsonRequest({ updates: [] })));
    expect(p.status).toBe(401);
  });

  it('lists attendees with their current gender', async () => {
    const { status, json } = await listCall();
    expect(status).toBe(200);
    expect(json.gender_available).toBe(true);
    expect(json.total).toBe(3);
    const bob = json.attendees.find((a: any) => a.ref_number === 'REF-2');
    expect(bob.gender).toBe('male');
    const alice = json.attendees.find((a: any) => a.ref_number === 'REF-1');
    expect(alice.gender).toBeNull();
  });

  it('applies a batch of gender updates', async () => {
    const { status, json } = await applyCall({
      updates: [
        { id: a1, gender: 'female' },
        { id: a2, gender: 'male' },
        { id: a3, gender: 'Female' }, // case-normalised
      ],
    });
    expect(status).toBe(200);
    expect(json.updated).toBe(3);

    const rows = await env.DB.prepare('SELECT ref_number, gender FROM attendees ORDER BY ref_number').all();
    const map = Object.fromEntries((rows.results as any[]).map(r => [r.ref_number, r.gender]));
    expect(map['REF-1']).toBe('female');
    expect(map['REF-2']).toBe('male');
    expect(map['REF-3']).toBe('female');
  });

  it('clears gender when given an unknown/blank value', async () => {
    await applyCall({ updates: [{ id: a2, gender: '' }, { id: a1, gender: 'nonsense' }] });
    const bob = await env.DB.prepare('SELECT gender FROM attendees WHERE id = ?').bind(a2).first();
    expect(bob!.gender).toBeNull();
  });

  it('rejects a payload without an updates array', async () => {
    const { status } = await applyCall({ nope: true });
    expect(status).toBe(400);
  });

  it('rejects updates with an invalid id', async () => {
    const { status } = await applyCall({ updates: [{ id: 'abc', gender: 'male' }] });
    expect(status).toBe(400);
  });

  it('treats an empty updates array as a no-op', async () => {
    const { status, json } = await applyCall({ updates: [] });
    expect(status).toBe(200);
    expect(json.updated).toBe(0);
  });
});
