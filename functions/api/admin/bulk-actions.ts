import type { PagesContext } from '../../_shared/types.js';
import { createResponse, checkAdminAuth, handleCORS } from '../../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../_shared/errors.js';
import { sendRoomAssignedEmail } from '../../_shared/notifications.js';
import { canAccommodate } from '../../_shared/room-allocation.js';

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

      case 'assign_room': {
        if (body.room_id === undefined) return createErrorResponse(errors.badRequest('room_id required', requestId));

        // Pre-flight: can the target room actually hold every existing
        // occupant who isn't being moved out PLUS every attendee in this
        // bulk call?
        const { results: targetRows } = await context.env.DB.prepare(
          'SELECT COALESCE(capacity, 1) AS capacity, COALESCE(cot_capacity, 0) AS cot_capacity, number FROM rooms WHERE id = ?'
        ).bind(body.room_id).all();
        if (!targetRows.length) return createErrorResponse(errors.badRequest(`Room ${body.room_id} not found`, requestId));
        const targetRoom = targetRows[0] as { capacity: number; cot_capacity: number; number: string };

        const { results: stayingOccupants } = await context.env.DB.prepare(
          `SELECT date_of_birth FROM attendees
           WHERE room_id = ?
             AND id NOT IN (${placeholders})
             AND (is_archived = 0 OR is_archived IS NULL)`
        ).bind(body.room_id, ...ids).all();

        const { results: incomingDobs } = await context.env.DB.prepare(
          `SELECT date_of_birth FROM attendees
           WHERE id IN (${placeholders})
             AND (is_archived = 0 OR is_archived IS NULL)`
        ).bind(...ids).all();

        const fit = canAccommodate(
          [
            ...(stayingOccupants as { date_of_birth: string | null }[]),
            ...(incomingDobs as { date_of_birth: string | null }[]),
          ],
          targetRoom
        );
        if (!fit.ok) {
          return createErrorResponse(errors.badRequest(
            `Room ${targetRoom.number} cannot accept this assignment — ${fit.message}. ` +
            `Beds: ${fit.bedsUsed}/${fit.bedsAvailable}, cots: ${fit.cotsUsed}/${fit.cotsAvailable}.`,
            requestId
          ));
        }

        // Capture only the attendees whose room actually changes — anyone
        // already in this room shouldn't get another email.
        const { results: changing } = await context.env.DB.prepare(
          `SELECT a.id, a.name, a.email, a.ref_number, g.name AS group_name
           FROM attendees a
           LEFT JOIN groups g ON g.id = a.group_id
           WHERE a.id IN (${placeholders}) AND (a.room_id IS NULL OR a.room_id != ?)`
        ).bind(...ids, body.room_id).all();

        await context.env.DB.prepare(
          `UPDATE attendees SET room_id = ? WHERE id IN (${placeholders})`
        ).bind(body.room_id, ...ids).run();
        updated = ids.length;

        // Fetch room once for the whole batch.
        const { results: roomRows } = await context.env.DB.prepare(
          'SELECT number, description, floor FROM rooms WHERE id = ?'
        ).bind(body.room_id).all();
        const room = roomRows[0] as { number: string; description: string | null; floor: string | null } | undefined;

        if (room && changing.length > 0) {
          // Fire-and-forget: send each notification through waitUntil so the
          // admin's bulk request returns promptly. Failures get logged.
          for (const a of changing as { id: number; name: string; email: string | null; ref_number: string; group_name: string | null }[]) {
            context.waitUntil(
              sendRoomAssignedEmail(
                context.env,
                { name: a.name, email: a.email, ref_number: a.ref_number },
                { number: room.number, description: room.description, floor: room.floor },
                a.group_name,
              ).then(sent => {
                if (!sent) console.warn(`[${requestId}] bulk room-assigned email not sent for attendee ${a.id}`);
              })
            );
          }
        }
        break;
      }

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

    // Audit log — store the actual target ids (as JSON) in details so the
    // audit row links back to the affected attendees, not just a count.
    await context.env.DB.prepare(
      'INSERT INTO audit_log (admin_user, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)'
    ).bind(
      admin.user,
      `bulk_${body.action}`,
      'attendee',
      ids[0] ?? 0, // representative id; full list lives in details
      JSON.stringify({ count: ids.length, attendee_ids: ids })
    ).run();

    return createResponse({ message: `${updated} attendees updated`, updated });

  } catch (error) {
    console.error(`[${requestId}] Bulk action error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
