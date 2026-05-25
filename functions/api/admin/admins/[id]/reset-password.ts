// POST /api/admin/admins/:id/reset-password
// Body: { new_password: string }
//
// Super-admin only. Sets a temp password for the target admin and flags
// must_reset_password = 1 so the next login is gated by the existing
// force-reset path (same machinery as migration 014's attendee path).

import type { PagesContext } from '../../../../_shared/types.js';
import { createResponse, requireSuperAdmin, handleCORS, hashPassword } from '../../../../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../../../_shared/errors.js';

interface IdParams { id: string; }

const MIN_PASSWORD_LENGTH = 8;

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

export async function onRequestPost(context: PagesContext<IdParams>): Promise<Response> {
  const requestId = generateRequestId();
  try {
    const admin = await requireSuperAdmin(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) return createErrorResponse(errors.forbidden('Super-admin role required', requestId));

    const id = parseInt(context.params.id, 10);
    if (!id) return createErrorResponse(errors.badRequest('Admin id required', requestId));

    const body = await context.request.json() as { new_password?: string };
    const newPassword = body.new_password ?? '';
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return createErrorResponse(errors.badRequest(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`, requestId));
    }

    const { results } = await context.env.DB.prepare('SELECT id, username FROM admins WHERE id = ?').bind(id).all();
    if (!results.length) return createErrorResponse(errors.notFound('Admin', requestId));
    const target = results[0] as { id: number; username: string };

    const hash = await hashPassword(newPassword);
    await context.env.DB.prepare(
      `UPDATE admins
       SET password_hash = ?, must_reset_password = 1, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).bind(hash, id).run();

    try {
      await context.env.DB.prepare(
        `INSERT INTO audit_log (admin_user, action, entity_type, entity_id, details)
         VALUES (?, 'admin_password_reset', 'admin', ?, ?)`
      ).bind(admin.user, id, JSON.stringify({ target: target.username })).run();
    } catch (err) {
      console.warn(`[${requestId}] audit_log write failed`, err);
    }

    return createResponse({
      success: true,
      message: `Password reset for ${target.username}. They will be forced to set a new one on next login.`,
    });
  } catch (error) {
    console.error(`[${requestId}] reset-password error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
