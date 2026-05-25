// GET /api/admin/me — return the current admin's profile (so the frontend
// can show "logged in as X" and gate super-admin-only UI).

import type { PagesContext } from '../../_shared/types.js';
import { createResponse, checkAdminAuth, handleCORS } from '../../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../_shared/errors.js';

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));

    if (admin.admin_id !== null) {
      const { results } = await context.env.DB.prepare(
        `SELECT id, username, role, full_name, email, is_active, last_login, created_at
         FROM admins WHERE id = ?`
      ).bind(admin.admin_id).all();
      if (results.length) return createResponse(results[0]);
    }

    // Token has no admin_id — env-var bootstrap login that pre-dates lazy
    // table creation. Return a minimal profile so the UI still works.
    return createResponse({
      id: null,
      username: admin.user,
      role: admin.role,
      full_name: admin.user,
      email: null,
      is_active: 1,
    });
  } catch (error) {
    console.error(`[${requestId}] /api/admin/me error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
