// DELETE /api/community/:id — remove your own community post.

import type { PagesContext } from '../../_shared/types.js';
import { createResponse, checkAttendeeAuth, handleCORS } from '../../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../_shared/errors.js';

interface IdParams { id: string; }

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

export async function onRequestDelete(context: PagesContext<IdParams>): Promise<Response> {
  const requestId = generateRequestId();
  try {
    const auth = await checkAttendeeAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!auth) return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));

    const meRows = await context.env.DB.prepare('SELECT id FROM attendees WHERE ref_number = ?').bind(auth.ref).all();
    if (!meRows.results.length) return createErrorResponse(errors.notFound('Attendee', requestId));
    const myId = (meRows.results[0] as { id: number }).id;

    // Only the author can delete their own post (admins use the admin route).
    const { results } = await context.env.DB.prepare(
      'SELECT attendee_id FROM community_posts WHERE id = ?'
    ).bind(context.params.id).all();
    if (!results.length) return createErrorResponse(errors.notFound('Post', requestId));
    if ((results[0] as { attendee_id: number | null }).attendee_id !== myId) {
      return createErrorResponse(errors.forbidden('You can only delete your own posts', requestId));
    }

    await context.env.DB.prepare('DELETE FROM community_posts WHERE id = ?').bind(context.params.id).run();
    return createResponse({ message: 'Deleted' });
  } catch (error) {
    console.error(`[${requestId}] community DELETE error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
