// Admin moderation of a single community post.
//   DELETE /api/admin/community/:id        → remove it
//   PATCH  /api/admin/community/:id {hide}  → hide/unhide it

import type { PagesContext } from '../../../_shared/types.js';
import { createResponse, checkAdminAuth, handleCORS } from '../../../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../../_shared/errors.js';

interface IdParams { id: string; }

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

export async function onRequestDelete(context: PagesContext<IdParams>): Promise<Response> {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));

    const { results } = await context.env.DB.prepare('SELECT id FROM community_posts WHERE id = ?').bind(context.params.id).all();
    if (!results.length) return createErrorResponse(errors.notFound('Post', requestId));

    await context.env.DB.prepare('DELETE FROM community_posts WHERE id = ?').bind(context.params.id).run();
    return createResponse({ message: 'Deleted' });
  } catch (error) {
    console.error(`[${requestId}] admin community DELETE error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}

export async function onRequestPatch(context: PagesContext<IdParams>): Promise<Response> {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));

    const body = await context.request.json().catch(() => ({})) as { hide?: boolean };
    const hidden = body.hide ? 1 : 0;

    const result = await context.env.DB.prepare('UPDATE community_posts SET is_hidden = ? WHERE id = ?')
      .bind(hidden, context.params.id).run();
    if (!result.meta || (result.meta.changes ?? 0) === 0) {
      return createErrorResponse(errors.notFound('Post', requestId));
    }
    return createResponse({ message: hidden ? 'Hidden' : 'Restored' });
  } catch (error) {
    console.error(`[${requestId}] admin community PATCH error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
