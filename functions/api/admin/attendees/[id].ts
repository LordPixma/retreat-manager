// Individual attendee operations with TypeScript and validation

import type { PagesContext } from '../../../_shared/types.js';
import { createResponse, checkAdminAuth, handleCORS, hashPassword } from '../../../_shared/auth.js';
import { validate, attendeeUpdateSchema } from '../../../_shared/validation.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../../_shared/errors.js';

interface AttendeeRow {
  id: number;
  ref_number: string;
  name: string;
  email: string | null;
  payment_due: number;
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
    const admin = checkAdminAuth(context.request);
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
        a.payment_due,
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
      payment_due: attendee.payment_due || 0,
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
    const admin = checkAdminAuth(context.request);
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

    // Check if attendee exists
    const { results: existingResults } = await context.env.DB.prepare(
      'SELECT id FROM attendees WHERE id = ?'
    ).bind(id).all();

    if (!existingResults.length) {
      return createErrorResponse(errors.notFound('Attendee', requestId));
    }

    // Build dynamic UPDATE query
    const allowedFields = ['name', 'email', 'ref_number', 'room_id', 'group_id', 'payment_due', 'password'];
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
    const admin = checkAdminAuth(context.request);
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

    const result = await context.env.DB.prepare(
      'DELETE FROM attendees WHERE id = ?'
    ).bind(id).run();

    if (!result.success) {
      throw new Error('Failed to delete attendee');
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
