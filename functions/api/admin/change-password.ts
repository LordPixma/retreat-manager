// POST /api/admin/change-password
// Body: { current_password: string, new_password: string }
//
// Self-serve password change. Requires a valid admin token AND knowledge of
// the current password (so a stolen token alone can't lock out the real
// admin by replacing their password).
//
// Also clears must_reset_password — used both by the forced-reset flow
// (after a super-admin runs /api/admin/admins/:id/reset-password) and the
// generic "change my password" affordance in the UI.

import type { PagesContext } from '../../_shared/types.js';
import {
  createResponse,
  checkAdminAuth,
  handleCORS,
  hashPassword,
  verifyPassword,
} from '../../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../_shared/errors.js';

const MIN_PASSWORD_LENGTH = 8;

interface AdminRow {
  id: number;
  username: string;
  password_hash: string | null;
}

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

export async function onRequestPost(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));

    const body = await context.request.json() as { current_password?: string; new_password?: string };
    const current = body.current_password ?? '';
    const next = body.new_password ?? '';

    if (!current || !next) {
      return createErrorResponse(errors.badRequest('current_password and new_password are required', requestId));
    }
    if (next.length < MIN_PASSWORD_LENGTH) {
      return createErrorResponse(errors.badRequest(`New password must be at least ${MIN_PASSWORD_LENGTH} characters`, requestId));
    }
    if (next === current) {
      return createErrorResponse(errors.badRequest('New password must be different from current password', requestId));
    }

    // Find the admin row — prefer admin_id from the token, fall back to
    // username for the env-var bootstrap case (admin_id may be null until
    // the row is lazy-created on first table-backed login).
    let row: AdminRow | null = null;
    if (admin.admin_id !== null) {
      const { results } = await context.env.DB.prepare(
        'SELECT id, username, password_hash FROM admins WHERE id = ?'
      ).bind(admin.admin_id).all();
      if (results.length) row = results[0] as unknown as AdminRow;
    }
    if (!row) {
      const { results } = await context.env.DB.prepare(
        'SELECT id, username, password_hash FROM admins WHERE username = ?'
      ).bind(admin.user).all();
      if (results.length) row = results[0] as unknown as AdminRow;
    }

    // Current-password check. If there's still no row (token from before
    // bootstrap), fall back to ADMIN_PASS env var since that's what they
    // would have used to log in.
    let currentValid = false;
    if (row?.password_hash) {
      currentValid = await verifyPassword(current, row.password_hash);
    } else if (context.env.ADMIN_PASS && admin.user === context.env.ADMIN_USER) {
      currentValid = current === context.env.ADMIN_PASS;
    }

    if (!currentValid) {
      return createErrorResponse(errors.unauthorized('Current password is incorrect', requestId));
    }

    const hash = await hashPassword(next);

    if (row) {
      await context.env.DB.prepare(
        `UPDATE admins
         SET password_hash = ?, must_reset_password = 0, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      ).bind(hash, row.id).run();
    } else {
      // No row even after fallback — create one for the env-var admin so
      // future logins go through the table.
      await context.env.DB.prepare(
        `INSERT INTO admins (username, password_hash, role, full_name, is_active, must_reset_password)
         VALUES (?, ?, 'super_admin', ?, 1, 0)`
      ).bind(admin.user, hash, admin.user).run();
    }

    try {
      await context.env.DB.prepare(
        `INSERT INTO audit_log (admin_user, action, entity_type, entity_id, details)
         VALUES (?, 'admin_self_password_change', 'admin', ?, ?)`
      ).bind(admin.user, row?.id ?? 0, JSON.stringify({ at: new Date().toISOString() })).run();
    } catch (err) {
      console.warn(`[${requestId}] audit_log write failed`, err);
    }

    return createResponse({ success: true, message: 'Password updated' });
  } catch (error) {
    console.error(`[${requestId}] admin change-password error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
