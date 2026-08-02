// Editable, per-year retreat information (name, theme, scripture, dates, venue,
// host, pricing). Stored in the generic `settings` k/v table so it survives the
// annual "Start New Season" reset, and edited from the admin Settings page.
// Everything falls back to sensible defaults when a key has never been set, so
// the app renders correctly on a fresh database.

import { setSetting } from './settings.js';

export interface RetreatConfig {
  name: string;
  tagline: string;
  scripture: string;
  dates: string;
  venue: string;
  host: string;
  price_adult: number;
  price_child: number;
  price_infant: number;
}

export const RETREAT_CONFIG_DEFAULTS: RetreatConfig = {
  name: 'Growth & Wisdom Family Retreat 2026',
  tagline: 'The Abundant Life',
  scripture: 'John 10:10 — "I have come that they may have life, and have it to the full."',
  dates: 'July 31 - August 2, 2026',
  venue: 'The Hayes, Swanwick, Derbyshire',
  host: 'Cloverleaf Christian Centre',
  price_adult: 200,
  price_child: 60,
  price_infant: 0,
};

// config field -> settings key
const KEY: Record<keyof RetreatConfig, string> = {
  name: 'retreat_name',
  tagline: 'retreat_tagline',
  scripture: 'retreat_scripture',
  dates: 'retreat_dates',
  venue: 'retreat_venue',
  host: 'retreat_host',
  price_adult: 'price_adult',
  price_child: 'price_child',
  price_infant: 'price_infant',
};

export const STRING_FIELDS: (keyof RetreatConfig)[] = ['name', 'tagline', 'scripture', 'dates', 'venue', 'host'];
export const PRICE_FIELDS: (keyof RetreatConfig)[] = ['price_adult', 'price_child', 'price_infant'];

// Read the whole config in a single query (the settings table is tiny), layering
// stored values over the defaults.
export async function getRetreatConfig(db: D1Database): Promise<RetreatConfig> {
  const cfg: RetreatConfig = { ...RETREAT_CONFIG_DEFAULTS };
  try {
    const { results } = await db.prepare('SELECT key, value FROM settings').all();
    const map = new Map<string, string | null>();
    for (const r of results as { key: string; value: string | null }[]) map.set(r.key, r.value);

    for (const f of STRING_FIELDS) {
      const v = map.get(KEY[f]);
      if (typeof v === 'string' && v.trim() !== '') (cfg[f] as string) = v;
    }
    for (const f of PRICE_FIELDS) {
      const v = map.get(KEY[f]);
      if (v !== undefined && v !== null && v !== '') {
        const n = Number(v);
        if (Number.isFinite(n) && n >= 0) (cfg[f] as number) = n;
      }
    }
  } catch {
    // settings table missing / query failed — defaults are fine.
  }
  return cfg;
}

// Persist only the provided fields. Prices coerced to non-negative numbers.
export async function setRetreatConfig(
  db: D1Database,
  partial: Partial<RetreatConfig>,
  adminUser: string,
): Promise<void> {
  for (const f of STRING_FIELDS) {
    const v = partial[f];
    if (v !== undefined) await setSetting(db, KEY[f], String(v), adminUser);
  }
  for (const f of PRICE_FIELDS) {
    const v = partial[f];
    if (v !== undefined) {
      const n = Math.max(0, Number(v) || 0);
      await setSetting(db, KEY[f], String(n), adminUser);
    }
  }
}
