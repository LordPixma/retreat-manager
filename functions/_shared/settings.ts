// Read/write helpers for the generic `settings` k/v table.

const CHECK_IN_OPEN_KEY = 'check_in_opens_at';
const CHECK_IN_CLOSE_KEY = 'check_in_closes_at';

export interface CheckInWindow {
  opens_at: string | null;
  closes_at: string | null;
}

export async function getSetting(db: D1Database, key: string): Promise<string | null> {
  try {
    const { results } = await db.prepare('SELECT value FROM settings WHERE key = ?').bind(key).all();
    if (!results.length) return null;
    return (results[0] as { value: string | null }).value;
  } catch {
    return null;
  }
}

export async function setSetting(db: D1Database, key: string, value: string | null, adminUser: string): Promise<void> {
  // Upsert pattern compatible with SQLite/D1.
  await db.prepare(
    `INSERT INTO settings (key, value, updated_at, updated_by) VALUES (?, ?, CURRENT_TIMESTAMP, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP, updated_by = excluded.updated_by`
  ).bind(key, value, adminUser).run();
}

export async function getCheckInWindow(db: D1Database): Promise<CheckInWindow> {
  return {
    opens_at: await getSetting(db, CHECK_IN_OPEN_KEY),
    closes_at: await getSetting(db, CHECK_IN_CLOSE_KEY),
  };
}

export async function setCheckInWindow(
  db: D1Database,
  opensAt: string | null,
  closesAt: string | null,
  adminUser: string,
): Promise<void> {
  await setSetting(db, CHECK_IN_OPEN_KEY, opensAt, adminUser);
  await setSetting(db, CHECK_IN_CLOSE_KEY, closesAt, adminUser);
}

/**
 * Returns null if check-in is allowed right now, or a human-readable string
 * describing why it isn't (admin can override).
 */
export function checkInWindowError(window: CheckInWindow, now: Date = new Date()): string | null {
  if (window.opens_at) {
    const opens = new Date(window.opens_at);
    if (!isNaN(opens.getTime()) && now < opens) {
      return `Check-in opens at ${opens.toISOString()}`;
    }
  }
  if (window.closes_at) {
    const closes = new Date(window.closes_at);
    if (!isNaN(closes.getTime()) && now > closes) {
      return `Check-in closed at ${closes.toISOString()}`;
    }
  }
  return null;
}
