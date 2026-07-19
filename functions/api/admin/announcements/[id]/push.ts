// POST /api/admin/announcements/:id/push
// Send a payload-less push to every subscribed device, waking their app to
// check the latest announcements. Expired subscriptions (404/410) are pruned.

import type { PagesContext } from '../../../../_shared/types.js';
import { createResponse, checkAdminAuth, handleCORS } from '../../../../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../../../_shared/errors.js';
import { pushConfigured, sendPush } from '../../../../_shared/webpush.js';

interface IdParams { id: string; }

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

export async function onRequestPost(context: PagesContext<IdParams>): Promise<Response> {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));

    if (!pushConfigured(context.env)) {
      return createErrorResponse(errors.badRequest('Push notifications are not configured (missing VAPID keys)', requestId));
    }

    // Confirm the announcement exists (the push itself is payload-less).
    const annRows = await context.env.DB.prepare('SELECT id FROM announcements WHERE id = ?').bind(context.params.id).all();
    if (!annRows.results.length) return createErrorResponse(errors.notFound('Announcement', requestId));

    const { results } = await context.env.DB.prepare('SELECT endpoint FROM push_subscriptions').all();
    const endpoints = (results as { endpoint: string }[]).map(r => r.endpoint);

    let sent = 0, failed = 0;
    const goneEndpoints: string[] = [];
    const BATCH = 25;
    for (let i = 0; i < endpoints.length; i += BATCH) {
      const batch = endpoints.slice(i, i + BATCH);
      const outcomes = await Promise.all(batch.map(ep => sendPush(ep, context.env).then(r => ({ ep, r }))));
      for (const { ep, r } of outcomes) {
        if (r.ok) sent++; else failed++;
        if (r.gone) goneEndpoints.push(ep);
      }
    }

    // Prune expired subscriptions.
    for (const ep of goneEndpoints) {
      await context.env.DB.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').bind(ep).run();
    }

    return createResponse({ sent, failed, removed: goneEndpoints.length, total: endpoints.length });
  } catch (error) {
    console.error(`[${requestId}] announcement push error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
