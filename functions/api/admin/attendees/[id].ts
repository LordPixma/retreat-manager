// Individual attendee operations with TypeScript and validation

import type { PagesContext } from '../../../_shared/types.js';
import { createResponse, checkAdminAuth, handleCORS, hashPassword } from '../../../_shared/auth.js';
import { validate, attendeeUpdateSchema } from '../../../_shared/validation.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../../_shared/errors.js';
import { sendRoomAssignedEmail } from '../../../_shared/notifications.js';
import { canAccommodate } from '../../../_shared/room-allocation.js';

interface AttendeeRow {
  id: number;
  ref_number: string;
  name: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;
  payment_due: number;
  payment_option: string | null;
  room_id: number | null;
  group_id: number | null;
  room_number: string | null;
  room_description: string | null;
  group_name: string | null;
}

interface IdParams {
  id: string;
}

// Handle CORS preflight
export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

// GET /api/admin/attendees/:id - Get single attendee
export async function onRequestGet(context: PagesContext<IdParams>): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));
    }

    const id = context.params.id;
    if (!id) {
      return createErrorResponse(errors.badRequest('Attendee ID is required', requestId));
    }

    const { results } = await context.env.DB.prepare(`
      SELECT
        a.id,
        a.ref_number,
        a.name,
        a.email,
        a.first_name,
        a.last_name,
        a.date_of_birth,
        a.payment_due,
        a.payment_option,
        a.room_id,
        a.group_id,
        r.number AS room_number,
        r.description AS room_description,
        g.name AS group_name
      FROM attendees a
      LEFT JOIN rooms r ON a.room_id = r.id
      LEFT JOIN groups g ON a.group_id = g.id
      WHERE a.id = ?
    `).bind(id).all();

    if (!results.length) {
      return createErrorResponse(errors.notFound('Attendee', requestId));
    }

    const attendee = results[0] as unknown as AttendeeRow;

    const formattedResult = {
      id: attendee.id,
      ref_number: attendee.ref_number,
      name: attendee.name,
      email: attendee.email,
      first_name: attendee.first_name,
      last_name: attendee.last_name,
      date_of_birth: attendee.date_of_birth,
      payment_due: attendee.payment_due || 0,
      payment_option: attendee.payment_option || 'full',
      room_id: attendee.room_id,
      group_id: attendee.group_id,
      room: attendee.room_number ? {
        number: attendee.room_number,
        description: attendee.room_description
      } : null,
      group: attendee.group_name ? { name: attendee.group_name } : null
    };

    return createResponse(formattedResult);

  } catch (error) {
    console.error(`[${requestId}] Error fetching attendee:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}

// PUT /api/admin/attendees/:id - Update attendee
export async function onRequestPut(context: PagesContext<IdParams>): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));
    }

    const id = context.params.id;
    if (!id) {
      return createErrorResponse(errors.badRequest('Attendee ID is required', requestId));
    }

    const updateData = await context.request.json() as Record<string, unknown>;

    // Validate input
    const validation = validate(updateData, attendeeUpdateSchema);
    if (!validation.valid) {
      return createErrorResponse(errors.validation(validation.errors, requestId));
    }

    // Read the existing row so we can detect a room-id transition after the
    // UPDATE and only email when the assignment actually changed. We also
    // need date_of_birth for the cot-eligibility check.
    const { results: existingResults } = await context.env.DB.prepare(
      'SELECT id, name, email, ref_number, room_id, group_id, date_of_birth FROM attendees WHERE id = ?'
    ).bind(id).all();

    if (!existingResults.length) {
      return createErrorResponse(errors.notFound('Attendee', requestId));
    }

    const existing = existingResults[0] as {
      id: number; name: string; email: string | null; ref_number: string;
      room_id: number | null; group_id: number | null; date_of_birth: string | null;
    };

    // If the request is moving this attendee to a different (non-null) room,
    // check that the target room can fit them under its bed/cot rules.
    const requestedRoomId = updateData.room_id;
    const movingToNewRoom =
      requestedRoomId !== undefined &&
      requestedRoomId !== null &&
      requestedRoomId !== '' &&
      Number(requestedRoomId) !== existing.room_id;

    if (movingToNewRoom) {
      const { results: roomCheck } = await context.env.DB.prepare(
        'SELECT COALESCE(capacity, 1) AS capacity, COALESCE(cot_capacity, 0) AS cot_capacity, number FROM rooms WHERE id = ?'
      ).bind(requestedRoomId).all();
      if (!roomCheck.length) {
        return createErrorResponse(errors.badRequest(`Target room ${requestedRoomId} not found`, requestId));
      }
      const targetRoom = roomCheck[0] as { capacity: number; cot_capacity: number; number: string };

      const { results: currentOccupants } = await context.env.DB.prepare(
        `SELECT date_of_birth FROM attendees
         WHERE room_id = ? AND id != ? AND (is_archived = 0 OR is_archived IS NULL)`
      ).bind(requestedRoomId, existing.id).all();

      const proposed = [
        ...(currentOccupants as { date_of_birth: string | null }[]),
        { date_of_birth: existing.date_of_birth },
      ];

      const fit = canAccommodate(proposed, targetRoom);
      if (!fit.ok) {
        return createErrorResponse(errors.badRequest(
          `Room ${targetRoom.number} cannot accept this attendee — ${fit.message}. ` +
          `Beds: ${fit.bedsUsed}/${fit.bedsAvailable}, cots: ${fit.cotsUsed}/${fit.cotsAvailable}.`,
          requestId
        ));
      }
    }

    // Build dynamic UPDATE query
    const allowedFields = ['name', 'first_name', 'last_name', 'date_of_birth', 'email', 'ref_number', 'room_id', 'group_id', 'payment_due', 'payment_option', 'password'];
    const updateFields: string[] = [];
    const updateValues: (string | number | null)[] = [];

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        if (key === 'password') {
          if (value && typeof value === 'string' && value.trim() !== '') {
            const hashedPassword = await hashPassword(value);
            updateFields.push('password_hash = ?');
            updateValues.push(hashedPassword);
          }
        } else {
          updateFields.push(`${key} = ?`);
          updateValues.push(value === '' ? null : value as string | number | null);
        }
      }
    }

    if (updateFields.length === 0) {
      return createErrorResponse(errors.badRequest('No valid fields to update', requestId));
    }

    updateValues.push(id);

    const updateQuery = `UPDATE attendees SET ${updateFields.join(', ')} WHERE id = ?`;
    const result = await context.env.DB.prepare(updateQuery).bind(...updateValues).run();

    if (!result.success) {
      throw new Error('Failed to update attendee');
    }

    try {
      await context.env.DB.prepare(
        `INSERT INTO audit_log (admin_user, action, entity_type, entity_id, details)
         VALUES (?, 'update', 'attendee', ?, ?)`
      ).bind(admin.user, parseInt(id), JSON.stringify({ fields: updateFields })).run();
    } catch (err) {
      console.warn(`[${requestId}] audit_log write failed`, err);
    }

    // Notify the attendee if their room assignment transitioned to a new
    // non-null value. We compare against the snapshot taken before the UPDATE.
    const newRoomId = updateData.room_id;
    const roomChanged =
      newRoomId !== undefined &&
      newRoomId !== null &&
      newRoomId !== '' &&
      Number(newRoomId) !== existing.room_id;

    if (roomChanged) {
      const { results: roomRows } = await context.env.DB.prepare(
        `SELECT r.number, r.description, r.floor, g.name AS group_name
         FROM rooms r
         LEFT JOIN attendees a ON a.id = ?
         LEFT JOIN groups g ON g.id = a.group_id
         WHERE r.id = ?`
      ).bind(parseInt(id), newRoomId).all();

      if (roomRows.length > 0) {
        const room = roomRows[0] as { number: string; description: string | null; floor: string | null; group_name: string | null };
        // Fire-and-forget — don't block the admin's save on Resend latency.
        context.waitUntil(
          sendRoomAssignedEmail(
            context.env,
            { name: existing.name, email: existing.email, ref_number: existing.ref_number },
            { number: room.number, description: room.description, floor: room.floor },
            room.group_name,
          ).then(sent => {
            if (!sent) console.warn(`[${requestId}] room-assigned email not sent for attendee ${id}`);
          })
        );
      }
    }

    return createResponse({
      success: true,
      message: 'Attendee updated successfully',
      id: parseInt(id)
    });

  } catch (error) {
    console.error(`[${requestId}] Error updating attendee:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}

// DELETE /api/admin/attendees/:id - Delete attendee
export async function onRequestDelete(context: PagesContext<IdParams>): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));
    }

    const id = context.params.id;
    if (!id) {
      return createErrorResponse(errors.badRequest('Attendee ID is required', requestId));
    }

    // Check if attendee exists
    const { results: existingResults } = await context.env.DB.prepare(
      'SELECT id, name, ref_number FROM attendees WHERE id = ?'
    ).bind(id).all();

    if (!existingResults.length) {
      return createErrorResponse(errors.notFound('Attendee', requestId));
    }

    const attendee = existingResults[0] as { id: number; name: string; ref_number: string };

    // Soft delete — archive instead of permanent delete
    const result = await context.env.DB.prepare(
      'UPDATE attendees SET is_archived = 1 WHERE id = ?'
    ).bind(id).run();

    if (!result.success) {
      throw new Error('Failed to archive attendee');
    }

    try {
      await context.env.DB.prepare(
        `INSERT INTO audit_log (admin_user, action, entity_type, entity_id, details)
         VALUES (?, 'archive', 'attendee', ?, ?)`
      ).bind(admin.user, parseInt(id), JSON.stringify({ ref_number: attendee.ref_number, name: attendee.name })).run();
    } catch (err) {
      console.warn(`[${requestId}] audit_log write failed`, err);
    }

    return createResponse({
      success: true,
      message: `Attendee ${attendee.name} deleted successfully`,
      deleted_attendee: {
        id: attendee.id,
        name: attendee.name,
        ref_number: attendee.ref_number
      }
    });

  } catch (error) {
    console.error(`[${requestId}] Error deleting attendee:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
