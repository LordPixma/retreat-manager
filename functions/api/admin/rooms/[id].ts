// Individual room operations with TypeScript and validation

import type { PagesContext } from '../../../_shared/types.js';
import { createResponse, checkAdminAuth, handleCORS } from '../../../_shared/auth.js';
import { validate, roomUpdateSchema } from '../../../_shared/validation.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../../_shared/errors.js';

interface RoomRow {
  id: number;
  number: string;
  description: string | null;
  occupant_count: number;
  occupants: string | null;
}

interface IdParams {
  id: string;
}

// Handle CORS preflight
export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

// GET /api/admin/rooms/:id - Get single room
export async function onRequestGet(context: PagesContext<IdParams>): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));
    }

    const id = context.params.id;

    const { results } = await context.env.DB.prepare(`
      SELECT
        r.id,
        r.number,
        r.description,
        COUNT(a.id) as occupant_count,
        GROUP_CONCAT(a.name, ', ') as occupants
      FROM rooms r
      LEFT JOIN attendees a ON r.id = a.room_id
      WHERE r.id = ?
      GROUP BY r.id, r.number, r.description
    `).bind(id).all();

    if (!results.length) {
      return createErrorResponse(errors.notFound('Room', requestId));
    }

    const room = results[0] as unknown as RoomRow;
    const formattedRoom = {
      id: room.id,
      number: room.number,
      description: room.description || '',
      occupant_count: room.occupant_count || 0,
      occupants: room.occupants ? room.occupants.split(', ').filter(Boolean) : []
    };

    return createResponse(formattedRoom);

  } catch (error) {
    console.error(`[${requestId}] Error fetching room:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}

// PUT /api/admin/rooms/:id - Update room
export async function onRequestPut(context: PagesContext<IdParams>): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));
    }

    const id = context.params.id;
    const body = await context.request.json() as Record<string, unknown>;

    // Validate input
    const validation = validate(body, roomUpdateSchema);
    if (!validation.valid) {
      return createErrorResponse(errors.validation(validation.errors, requestId));
    }

    const { number, description } = body as { number?: string; description?: string };

    if (!number || !number.trim()) {
      return createErrorResponse(errors.badRequest('Room number is required', requestId));
    }

    // Check if room exists
    const { results: existing } = await context.env.DB.prepare(
      'SELECT id FROM rooms WHERE id = ?'
    ).bind(id).all();

    if (!existing.length) {
      return createErrorResponse(errors.notFound('Room', requestId));
    }

    // Check if new number conflicts with another room
    const { results: conflict } = await context.env.DB.prepare(
      'SELECT id FROM rooms WHERE number = ? AND id != ?'
    ).bind(number.trim(), id).all();

    if (conflict.length > 0) {
      return createErrorResponse(errors.conflict('Room number already exists', requestId));
    }

    // Update room
    const result = await context.env.DB.prepare(
      'UPDATE rooms SET number = ?, description = ? WHERE id = ?'
    ).bind(number.trim(), description?.trim() || null, id).run();

    if (!result.success) {
      throw new Error('Failed to update room');
    }

    return createResponse({
      success: true,
      message: 'Room updated successfully'
    });

  } catch (error) {
    console.error(`[${requestId}] Error updating room:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}

// DELETE /api/admin/rooms/:id - Delete room
export async function onRequestDelete(context: PagesContext<IdParams>): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));
    }

    const id = context.params.id;

    // Check if room exists
    const { results: existing } = await context.env.DB.prepare(
      'SELECT id, number FROM rooms WHERE id = ?'
    ).bind(id).all();

    if (!existing.length) {
      return createErrorResponse(errors.notFound('Room', requestId));
    }

    const room = existing[0] as unknown as { id: number; number: string };

    // Check if room has occupants
    const { results: occupants } = await context.env.DB.prepare(
      'SELECT COUNT(*) as count FROM attendees WHERE room_id = ?'
    ).bind(id).all();

    if ((occupants[0] as unknown as { count: number }).count > 0) {
      return createErrorResponse(
        errors.conflict('Cannot delete room with occupants. Please reassign attendees first.', requestId)
      );
    }

    // Delete room
    const result = await context.env.DB.prepare(
      'DELETE FROM rooms WHERE id = ?'
    ).bind(id).run();

    if (!result.success) {
      throw new Error('Failed to delete room');
    }

    return createResponse({
      success: true,
      message: `Room ${room.number} deleted successfully`
    });

  } catch (error) {
    console.error(`[${requestId}] Error deleting room:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
