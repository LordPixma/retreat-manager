// GET /api/admin/community — all community posts (incl. hidden) for moderation.

import type { PagesContext } from '../../../_shared/types.js';
import { createResponse, checkAdminAuth, handleCORS } from '../../../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../../_shared/errors.js';

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));

    const { results } = await context.env.DB.prepare(`
      SELECT id, attendee_id, author_name, post_type, content, is_hidden, created_at
      FROM community_posts
      ORDER BY created_at DESC, id DESC
      LIMIT 500
    `).all();

    return createResponse({ posts: results });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('no such table')) return createResponse({ posts: [] });
    console.error(`[${requestId}] admin community GET error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
