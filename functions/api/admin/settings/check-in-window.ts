// GET/PUT /api/admin/settings/check-in-window
// Reads or writes the open/close timestamps controlling the check-in window.
// Both fields accept ISO-8601 strings or null (null = no boundary on that side).

import type { PagesContext } from '../../../_shared/types.js';
import { createResponse, checkAdminAuth, handleCORS } from '../../../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../../_shared/errors.js';
import { getCheckInWindow, setCheckInWindow } from '../../../_shared/settings.js';

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));

    const window = await getCheckInWindow(context.env.DB);
    return createResponse(window);
  } catch (error) {
    console.error(`[${requestId}] check-in window GET error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}

export async function onRequestPut(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));

    const body = await context.request.json() as { opens_at?: string | null; closes_at?: string | null };
    const opens = body.opens_at?.trim() || null;
    const closes = body.closes_at?.trim() || null;

    // Sanity-check: both supplied + close before open is rejected.
    if (opens && closes) {
      const o = new Date(opens);
      const c = new Date(closes);
      if (isNaN(o.getTime()) || isNaN(c.getTime())) {
        return createErrorResponse(errors.badRequest('opens_at and closes_at must be ISO-8601 datetimes', requestId));
      }
      if (c <= o) {
        return createErrorResponse(errors.badRequest('closes_at must be after opens_at', requestId));
      }
    }

    await setCheckInWindow(context.env.DB, opens, closes, admin.user);

    try {
      await context.env.DB.prepare(
        `INSERT INTO audit_log (admin_user, action, entity_type, entity_id, details)
         VALUES (?, 'set_check_in_window', 'settings', 0, ?)`
      ).bind(admin.user, JSON.stringify({ opens_at: opens, closes_at: closes })).run();
    } catch (err) {
      console.warn(`[${requestId}] audit_log write failed`, err);
    }

    return createResponse({ opens_at: opens, closes_at: closes });
  } catch (error) {
    console.error(`[${requestId}] check-in window PUT error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
