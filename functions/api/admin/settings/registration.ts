// GET/PUT /api/admin/settings/registration
// Reads or flips whether the public registration form is accepting new
// submissions. Body for PUT: { open: boolean }.

import type { PagesContext } from '../../../_shared/types.js';
import { createResponse, checkAdminAuth, handleCORS } from '../../../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../../_shared/errors.js';
import { getRegistrationsOpen, setRegistrationsOpen } from '../../../_shared/settings.js';

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));

    const open = await getRegistrationsOpen(context.env.DB);
    return createResponse({ open });
  } catch (error) {
    console.error(`[${requestId}] registration setting GET error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}

export async function onRequestPut(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));

    const body = await context.request.json() as { open?: unknown };
    if (typeof body.open !== 'boolean') {
      return createErrorResponse(errors.badRequest('open must be a boolean', requestId));
    }

    await setRegistrationsOpen(context.env.DB, body.open, admin.user);

    try {
      await context.env.DB.prepare(
        `INSERT INTO audit_log (admin_user, action, entity_type, entity_id, details)
         VALUES (?, 'set_registrations_open', 'settings', 0, ?)`
      ).bind(admin.user, JSON.stringify({ open: body.open })).run();
    } catch (err) {
      console.warn(`[${requestId}] audit_log write failed`, err);
    }

    return createResponse({ open: body.open });
  } catch (error) {
    console.error(`[${requestId}] registration setting PUT error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
