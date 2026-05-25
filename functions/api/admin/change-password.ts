// POST /api/admin/change-password
//
// Two entry modes:
//
//   AUTHENTICATED (Bearer token):
//     Body { current_password, new_password }
//     The token identifies the admin; current_password is required so a
//     stolen token alone can't take over the account.
//
//   UNAUTHENTICATED FORCED-RESET (no Bearer token):
//     Body { username, current_password, new_password }
//     Only allowed when the admin's row is flagged must_reset_password = 1.
//     This is the recovery path when login.ts has returned a 403
//     reset_required and the user has no usable token yet.
//
// Both paths verify the current password and clear must_reset_password.

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
  must_reset_password: number;
}

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

export async function onRequestPost(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();
  try {
    const body = await context.request.json() as {
      username?: string;
      current_password?: string;
      new_password?: string;
    };
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

    const hasAuthHeader = !!context.request.headers.get('Authorization');
    const secret = context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET;

    let resolvedUsername: string | null = null;
    let row: AdminRow | null = null;
    let isForcedResetPath = false;

    if (hasAuthHeader) {
      // Authenticated self-serve path — token identifies the admin.
      const admin = await checkAdminAuth(context.request, secret);
      if (!admin) return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));
      resolvedUsername = admin.user;
      if (admin.admin_id !== null) {
        const { results } = await context.env.DB.prepare(
          'SELECT id, username, password_hash, must_reset_password FROM admins WHERE id = ?'
        ).bind(admin.admin_id).all();
        if (results.length) row = results[0] as unknown as AdminRow;
      }
      if (!row) {
        const { results } = await context.env.DB.prepare(
          'SELECT id, username, password_hash, must_reset_password FROM admins WHERE username = ?'
        ).bind(admin.user).all();
        if (results.length) row = results[0] as unknown as AdminRow;
      }
    } else {
      // Unauthenticated forced-reset path — username must be in the body
      // and the row must actually be flagged.
      const username = body.username?.trim();
      if (!username) {
        return createErrorResponse(errors.badRequest('username required when not authenticated', requestId));
      }
      resolvedUsername = username;
      const { results } = await context.env.DB.prepare(
        'SELECT id, username, password_hash, must_reset_password FROM admins WHERE username = ?'
      ).bind(username).all();
      if (!results.length) {
        return createErrorResponse(errors.unauthorized('Invalid credentials', requestId));
      }
      row = results[0] as unknown as AdminRow;
      if (row.must_reset_password !== 1) {
        // Don't let an unauthenticated caller change a password just because
        // they know it — that bypasses session-level lockout we'd otherwise
        // depend on. Force them through the normal token-authed path.
        return createErrorResponse(errors.forbidden('Password change requires authentication; use the normal change-password flow.', requestId));
      }
      isForcedResetPath = true;
    }

    // Verify the current password.
    let currentValid = false;
    if (row?.password_hash) {
      currentValid = await verifyPassword(current, row.password_hash);
    } else if (
      !isForcedResetPath
      && context.env.ADMIN_PASS
      && resolvedUsername === context.env.ADMIN_USER
    ) {
      // Authenticated env-var admin who hasn't been bootstrapped into the
      // table yet — fall back to comparing against ADMIN_PASS.
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
      ).bind(resolvedUsername, hash, resolvedUsername).run();
    }

    try {
      await context.env.DB.prepare(
        `INSERT INTO audit_log (admin_user, action, entity_type, entity_id, details)
         VALUES (?, ?, 'admin', ?, ?)`
      ).bind(
        resolvedUsername,
        isForcedResetPath ? 'admin_forced_reset_completed' : 'admin_self_password_change',
        row?.id ?? 0,
        JSON.stringify({ at: new Date().toISOString() }),
      ).run();
    } catch (err) {
      console.warn(`[${requestId}] audit_log write failed`, err);
    }

    return createResponse({ success: true, message: 'Password updated' });
  } catch (error) {
    console.error(`[${requestId}] admin change-password error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
