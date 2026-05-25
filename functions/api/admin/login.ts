// Admin login endpoint with TypeScript, validation, and security.
//
// Lookup order:
//   1. `admins` table (multi-admin world, post-migration 020).
//   2. ADMIN_USER / ADMIN_PASS env-var bootstrap — only matches when the
//      table is empty OR when the env-var username doesn't yet have a row.
//      On successful env-var match we lazy-insert that user as
//      `super_admin` so the next login goes through the table.
//
// The env-var path stays available so we always have an emergency entry
// even if the admins table is wiped or every admin is deactivated.

import type { AdminRole, PagesContext } from '../../_shared/types.js';
import {
  createResponse,
  handleCORS,
  generateAdminToken,
  hashPassword,
  verifyPassword,
  checkRateLimit,
  recordLoginAttempt,
  clearRateLimit,
} from '../../_shared/auth.js';
import { validate, adminLoginSchema } from '../../_shared/validation.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../_shared/errors.js';

interface AdminRow {
  id: number;
  username: string;
  password_hash: string | null;
  role: AdminRole;
  is_active: number;
  must_reset_password: number;
}

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

export async function onRequestPost(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const body = await context.request.json() as Record<string, unknown>;

    const validation = validate(body, adminLoginSchema);
    if (!validation.valid) {
      return createErrorResponse(errors.validation(validation.errors, requestId));
    }

    const { user, pass } = body as { user: string; pass: string };
    // Usernames are case-insensitive — normalise here so the lowercased
    // form is what we store in audit logs, login_history, rate-limit
    // identifiers, and compare against env-var ADMIN_USER.
    const trimmedUser = user.trim().toLowerCase();

    const clientIP = context.request.headers.get('CF-Connecting-IP') ||
                     context.request.headers.get('X-Forwarded-For') ||
                     'unknown';

    const rateLimit = await checkRateLimit(context.env.DB, trimmedUser, 'admin', clientIP);
    if (!rateLimit.allowed) {
      return createErrorResponse(errors.rateLimited(Math.ceil((rateLimit.resetTime - Date.now()) / 1000), requestId));
    }

    // Step 1 — try the admins table.
    let row = await loadAdminRow(context, trimmedUser);
    let matchedRole: AdminRole | null = null;
    let matchedAdminId: number | null = null;
    let needsForcedReset = false;

    if (row) {
      if (!row.is_active) {
        await recordLoginAttempt(context.env.DB, trimmedUser, 'admin', false, clientIP);
        return createErrorResponse(errors.unauthorized('Account is deactivated', requestId));
      }
      if (row.password_hash && await verifyPassword(pass, row.password_hash)) {
        matchedRole = row.role;
        matchedAdminId = row.id;
        needsForcedReset = row.must_reset_password === 1;
      }
    }

    // Step 2 — env-var fallback if the table didn't authenticate.
    if (!matchedRole) {
      const adminUser = context.env.ADMIN_USER;
      const adminPass = context.env.ADMIN_PASS;
      if (!adminUser || !adminPass) {
        console.error(`[${requestId}] ADMIN_USER/ADMIN_PASS not set in environment`);
        await recordLoginAttempt(context.env.DB, trimmedUser, 'admin', false, clientIP);
        return createErrorResponse(errors.unauthorized('Invalid credentials', requestId));
      }
      // adminUser env var is compared case-insensitively (we've already
      // lowercased trimmedUser). Password stays case-sensitive.
      if (timingSafeEqual(trimmedUser, adminUser.toLowerCase()) && timingSafeEqual(pass, adminPass)) {
        matchedRole = 'super_admin';
        // Lazy-bootstrap: ensure a `super_admin` row exists for this user,
        // hashed via PBKDF2 so subsequent logins go through the table path.
        matchedAdminId = await ensureBootstrapSuperAdmin(context, trimmedUser, pass);
      }
    }

    if (!matchedRole) {
      await recordLoginAttempt(context.env.DB, trimmedUser, 'admin', false, clientIP);
      return createErrorResponse(errors.unauthorized('Invalid credentials', requestId));
    }

    await recordLoginAttempt(context.env.DB, trimmedUser, 'admin', true, clientIP);
    await clearRateLimit(context.env.DB, trimmedUser, 'admin');

    // Refresh last_login on the admin row (if we have one).
    if (matchedAdminId !== null) {
      try {
        await context.env.DB.prepare(
          'UPDATE admins SET last_login = CURRENT_TIMESTAMP WHERE id = ?'
        ).bind(matchedAdminId).run();
      } catch (err) {
        console.warn(`[${requestId}] failed to update admins.last_login`, err);
      }
    }

    await context.env.DB.prepare(
      `INSERT INTO login_history (user_type, user_id, login_time) VALUES ('admin', ?, CURRENT_TIMESTAMP)`
    ).bind(trimmedUser).run();

    try {
      await context.env.DB.prepare(
        `INSERT INTO audit_log (admin_user, action, entity_type, entity_id, details)
         VALUES (?, 'login', 'admin', ?, ?)`
      ).bind(trimmedUser, matchedAdminId ?? 0, JSON.stringify({ ip: clientIP, role: matchedRole })).run();
    } catch (err) {
      console.warn(`[${requestId}] audit_log write failed`, err);
    }

    // If the admin row is flagged must_reset_password, refuse to issue a
    // working token and tell the UI to drop into the reset flow first.
    if (needsForcedReset) {
      return createResponse(
        { reset_required: true, message: 'You must set a new password to continue.' },
        403
      );
    }

    const token = await generateAdminToken(
      trimmedUser,
      matchedRole,
      context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET,
      matchedAdminId,
    );

    return createResponse({ token, role: matchedRole });

  } catch (error) {
    console.error(`[${requestId}] Error in admin login:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}

async function loadAdminRow(context: PagesContext, username: string): Promise<AdminRow | null> {
  try {
    // COLLATE NOCASE so existing rows with mixed-case usernames (created
    // before normalisation landed) still match the lowercased input.
    const { results } = await context.env.DB.prepare(
      `SELECT id, username, password_hash, role, is_active, must_reset_password
       FROM admins WHERE username = ? COLLATE NOCASE`
    ).bind(username).all();
    if (!results.length) return null;
    return results[0] as unknown as AdminRow;
  } catch (err) {
    // Pre-migration the table may not exist — that's fine, fall through to
    // env-var path. Log so it's visible if the migration is truly broken.
    console.warn('[admin/login] admins table lookup failed (table missing?)', err);
    return null;
  }
}

async function ensureBootstrapSuperAdmin(
  context: PagesContext,
  username: string,
  plaintextPassword: string,
): Promise<number | null> {
  try {
    const existing = await loadAdminRow(context, username);
    if (existing) {
      // Already in the table — backfill password_hash if it's NULL so the
      // env-var path stops being needed for this user.
      if (!existing.password_hash) {
        const hash = await hashPassword(plaintextPassword);
        await context.env.DB.prepare(
          `UPDATE admins SET password_hash = ?, role = 'super_admin', is_active = 1, must_reset_password = 0
           WHERE id = ?`
        ).bind(hash, existing.id).run();
      }
      return existing.id;
    }

    const hash = await hashPassword(plaintextPassword);
    const result = await context.env.DB.prepare(
      `INSERT INTO admins (username, password_hash, role, full_name, is_active)
       VALUES (?, ?, 'super_admin', ?, 1)`
    ).bind(username, hash, username).run();

    return result.meta.last_row_id as number;
  } catch (err) {
    // Even if bootstrap fails, the env-var login still works; we just lose
    // the audit-id linkage. Don't fail the login over a bootstrap blip.
    console.warn('[admin/login] super-admin bootstrap failed', err);
    return null;
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    let result = 0;
    for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ a.charCodeAt(i);
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}
