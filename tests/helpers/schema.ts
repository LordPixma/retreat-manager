import { env } from 'cloudflare:test';

// Focused schema for the integration tests. The real migration chain isn't
// cleanly replayable on a fresh DB (the announcements table is created
// out-of-band before an earlier migration indexes it, and a trigger's internal
// semicolons defeat naive splitting), so we create exactly the tables the
// tested endpoints use, with the columns those handlers read/write.
const STATEMENTS = [
  `CREATE TABLE attendees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ref_number TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    preferred_name TEXT,
    date_of_birth TEXT,
    email TEXT,
    phone TEXT,
    emergency_contact TEXT,
    postal_address TEXT,
    dietary_requirements TEXT,
    medical_conditions TEXT,
    accessibility_needs TEXT,
    special_requests TEXT,
    tshirt_size TEXT,
    arrival_method TEXT,
    vehicle_registration TEXT,
    gender TEXT,
    password_hash TEXT NOT NULL,
    payment_due REAL DEFAULT 0,
    payment_option TEXT DEFAULT 'full',
    payment_status TEXT DEFAULT 'pending',
    is_group_lead INTEGER DEFAULT 0,
    must_reset_password INTEGER DEFAULT 0,
    checked_in INTEGER DEFAULT 0,
    is_archived INTEGER DEFAULT 0,
    room_id INTEGER,
    group_id INTEGER,
    last_login DATETIME,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    number TEXT,
    description TEXT
  )`,
  `CREATE TABLE groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT
  )`,
  `CREATE TABLE registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT,
    family_members TEXT,
    total_amount REAL DEFAULT 0,
    member_count INTEGER DEFAULT 1,
    payment_option TEXT DEFAULT 'full',
    status TEXT DEFAULT 'approved',
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'general',
    priority INTEGER DEFAULT 1,
    target_audience TEXT DEFAULT 'all',
    target_groups TEXT,
    author_name TEXT,
    is_active INTEGER DEFAULT 1,
    starts_at DATETIME,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE activity_teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT NOT NULL DEFAULT '#8b5cf6',
    leader_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE activity_team_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    attendee_id INTEGER NOT NULL,
    UNIQUE(team_id, attendee_id)
  )`,
  `CREATE TABLE community_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    attendee_id INTEGER,
    author_name TEXT NOT NULL,
    post_type TEXT NOT NULL DEFAULT 'note',
    content TEXT NOT NULL,
    is_hidden INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE login_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    identifier TEXT NOT NULL,
    user_type TEXT NOT NULL,
    success INTEGER NOT NULL,
    ip_address TEXT,
    attempt_time INTEGER NOT NULL
  )`,
  `CREATE TABLE login_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_type TEXT NOT NULL,
    user_id TEXT NOT NULL,
    login_time DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_user TEXT,
    action TEXT,
    entity_type TEXT,
    entity_id INTEGER,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
];

export async function createSchema() {
  for (const sql of STATEMENTS) {
    await env.DB.prepare(sql).run();
  }
}
