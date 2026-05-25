/*
  Multi-admin support.

  Before this migration the portal had a single admin authenticated by
  ADMIN_USER / ADMIN_PASS environment variables. This adds an `admins`
  table so multiple administrators can log in, plus a `super_admin` role
  that's required to manage other admins.

  Bootstrap strategy (no env-var values needed at migration time):
    * Migration just creates the empty table.
    * /api/admin/login lazy-creates the env-var admin as `super_admin` on
      its first successful login (only when the table is empty). After
      that, the table is the source of truth.
    * Env-var fallback also fires if the table is ever wiped — emergency
      access path so we never lock ourselves out.

  Block comments (not -- line comments) because the Cloudflare D1 web
  console sometimes collapses pasted SQL onto fewer lines and a --
  comment then swallows the rest of the statement.
*/

CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  full_name TEXT,
  email TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  must_reset_password INTEGER NOT NULL DEFAULT 0,
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES admins(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);
CREATE INDEX IF NOT EXISTS idx_admins_active   ON admins(is_active);
