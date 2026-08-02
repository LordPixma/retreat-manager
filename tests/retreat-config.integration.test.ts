import { describe, it, expect, beforeEach } from 'vitest';
import { onRequestGet as publicConfig } from '../functions/api/config.js';
import { onRequestGet as getRetreat, onRequestPut as putRetreat } from '../functions/api/admin/settings/retreat.js';
import { onRequestGet as registerInfo } from '../functions/api/register.js';
import { setupDb, jsonRequest, methodRequest, adminBearer, ctx } from './helpers/db.js';

async function getConfig() {
  const res = await publicConfig(ctx(methodRequest('GET')));
  return { status: res.status, json: await res.json() as any };
}
async function putConfig(body: any, headers?: Record<string, string>) {
  const res = await putRetreat(ctx(jsonRequest(body, headers ?? await adminBearer())));
  return { status: res.status, json: await res.json().catch(() => ({})) as any };
}

describe('retreat config', () => {
  beforeEach(async () => {
    await setupDb();
  });

  it('serves sensible defaults on an empty settings table', async () => {
    const { status, json } = await getConfig();
    expect(status).toBe(200);
    expect(json.name).toContain('Growth');
    expect(json.price_adult).toBe(200);
    expect(json.price_child).toBe(60);
    expect(json.price_infant).toBe(0);
    expect(json.registrations_open).toBe(true);
  });

  it('admin update is reflected by the public config (only changed fields)', async () => {
    const put = await putConfig({ name: 'Growth & Wisdom 2027', dates: 'July 30 – Aug 1, 2027', price_adult: 250 });
    expect(put.status).toBe(200);
    expect(put.json.name).toBe('Growth & Wisdom 2027');

    const { json } = await getConfig();
    expect(json.name).toBe('Growth & Wisdom 2027');
    expect(json.dates).toBe('July 30 – Aug 1, 2027');
    expect(json.price_adult).toBe(250);
    // Untouched fields keep their defaults.
    expect(json.tagline).toBe('The Abundant Life');
    expect(json.price_child).toBe(60);
  });

  it('register info pricing follows the configured prices', async () => {
    await putConfig({ price_adult: 300, price_child: 90 });
    const res = await registerInfo(ctx(methodRequest('GET')));
    const json = await res.json() as any;
    expect(res.status).toBe(200);
    expect(json.pricing.adult.price).toBe(300);
    expect(json.pricing.child.price).toBe(90);
  });

  it('requires admin auth to update', async () => {
    const res = await putRetreat(ctx(jsonRequest({ name: 'Hacked' })));
    expect(res.status).toBe(401);
    // GET admin endpoint too
    const g = await getRetreat(ctx(methodRequest('GET')));
    expect(g.status).toBe(401);
  });

  it('rejects an empty name and a negative price', async () => {
    const empty = await putConfig({ name: '   ' });
    expect(empty.status).toBe(400);
    const neg = await putConfig({ price_adult: -5 });
    expect(neg.status).toBe(400);
  });

  it('rejects a payload with no recognised fields', async () => {
    const res = await putConfig({ nonsense: true });
    expect(res.status).toBe(400);
  });
});
