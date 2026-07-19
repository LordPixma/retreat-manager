// Attendee push subscription management.
//   POST   /api/push/subscribe  { endpoint, keys:{p256dh, auth} } → store
//   DELETE /api/push/subscribe  { endpoint }                      → remove

import type { PagesContext } from '../../_shared/types.js';
import { createResponse, checkAttendeeAuth, handleCORS } from '../../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../_shared/errors.js';

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

export async function onRequestPost(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();
  try {
    const auth = await checkAttendeeAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!auth) return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));

    const body = await context.request.json().catch(() => ({})) as {
      endpoint?: string;
      keys?: { p256dh?: string; auth?: string };
    };
    if (!body.endpoint) return createErrorResponse(errors.badRequest('endpoint is required', requestId));

    const meRows = await context.env.DB.prepare('SELECT id FROM attendees WHERE ref_number = ?').bind(auth.ref).all();
    const attendeeId = meRows.results.length ? (meRows.results[0] as { id: number }).id : null;

    // Upsert on endpoint (a device re-subscribing updates its keys/owner).
    await context.env.DB.prepare(`
      INSERT INTO push_subscriptions (attendee_id, endpoint, p256dh, auth)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(endpoint) DO UPDATE SET
        attendee_id = excluded.attendee_id,
        p256dh = excluded.p256dh,
        auth = excluded.auth
    `).bind(attendeeId, body.endpoint, body.keys?.p256dh ?? null, body.keys?.auth ?? null).run();

    return createResponse({ subscribed: true });
  } catch (error) {
    console.error(`[${requestId}] push subscribe error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}

export async function onRequestDelete(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();
  try {
    const auth = await checkAttendeeAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!auth) return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));

    const body = await context.request.json().catch(() => ({})) as { endpoint?: string };
    if (!body.endpoint) return createErrorResponse(errors.badRequest('endpoint is required', requestId));

    await context.env.DB.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').bind(body.endpoint).run();
    return createResponse({ unsubscribed: true });
  } catch (error) {
    console.error(`[${requestId}] push unsubscribe error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
