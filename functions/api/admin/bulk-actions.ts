import type { PagesContext } from '../../_shared/types.js';
import { createResponse, checkAdminAuth, handleCORS } from '../../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../_shared/errors.js';

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

// POST /api/admin/bulk-actions
export async function onRequestPost(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));

    const body = await context.request.json() as {
      action: 'assign_group' | 'assign_room' | 'archive' | 'unarchive';
      attendee_ids: number[];
      group_id?: number;
      room_id?: number;
    };

    if (!body.action || !body.attendee_ids || body.attendee_ids.length === 0) {
      return createErrorResponse(errors.badRequest('Action and attendee_ids are required', requestId));
    }

    const ids = body.attendee_ids;
    const placeholders = ids.map(() => '?').join(',');
    let updated = 0;

    switch (body.action) {
      case 'assign_group':
        if (body.group_id === undefined) return createErrorResponse(errors.badRequest('group_id required', requestId));
        await context.env.DB.prepare(
          `UPDATE attendees SET group_id = ? WHERE id IN (${placeholders})`
        ).bind(body.group_id, ...ids).run();
        updated = ids.length;
        break;

      case 'assign_room':
        if (body.room_id === undefined) return createErrorResponse(errors.badRequest('room_id required', requestId));
        await context.env.DB.prepare(
          `UPDATE attendees SET room_id = ? WHERE id IN (${placeholders})`
        ).bind(body.room_id, ...ids).run();
        updated = ids.length;
        break;

      case 'archive':
        await context.env.DB.prepare(
          `UPDATE attendees SET is_archived = 1 WHERE id IN (${placeholders})`
        ).bind(...ids).run();
        updated = ids.length;
        break;

      case 'unarchive':
        await context.env.DB.prepare(
          `UPDATE attendees SET is_archived = 0 WHERE id IN (${placeholders})`
        ).bind(...ids).run();
        updated = ids.length;
        break;

      default:
        return createErrorResponse(errors.badRequest('Invalid action', requestId));
    }

    // Audit log
    await context.env.DB.prepare(
      'INSERT INTO audit_log (admin_user, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)'
    ).bind(admin.user, `bulk_${body.action}`, 'attendee', 0, `Bulk ${body.action} on ${ids.length} attendees`).run();

    return createResponse({ message: `${updated} attendees updated`, updated });

  } catch (error) {
    console.error(`[${requestId}] Bulk action error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
