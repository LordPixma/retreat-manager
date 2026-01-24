// Rooms list and create endpoint with TypeScript, validation, and pagination

import type { PagesContext } from '../../../_shared/types.js';
import { createResponse, checkAdminAuth, handleCORS } from '../../../_shared/auth.js';
import { validate, roomCreateSchema } from '../../../_shared/validation.js';
import { parsePaginationParams, createPaginatedResponse } from '../../../_shared/pagination.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../../_shared/errors.js';

interface RoomRow {
  id: number;
  number: string;
  description: string | null;
  occupant_count: number;
  occupants: string | null;
}

interface CountResult {
  total: number;
}

// Handle CORS preflight
export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

// GET /api/admin/rooms - List all rooms with pagination
export async function onRequestGet(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const admin = checkAdminAuth(context.request);
    if (!admin) {
      return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));
    }

    const url = new URL(context.request.url);
    const { limit, offset } = parsePaginationParams(url);

    // Get total count
    const { results: countResult } = await context.env.DB.prepare(
      'SELECT COUNT(*) as total FROM rooms'
    ).all();
    const total = (countResult[0] as unknown as CountResult).total;

    // Get rooms with occupancy information and pagination
    const { results } = await context.env.DB.prepare(`
      SELECT
        r.id,
        r.number,
        r.description,
        COUNT(a.id) as occupant_count,
        GROUP_CONCAT(a.name, ', ') as occupants
      FROM rooms r
      LEFT JOIN attendees a ON r.id = a.room_id
      GROUP BY r.id, r.number, r.description
      ORDER BY r.number
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all();

    const formattedRooms = (results as unknown as RoomRow[]).map(room => ({
      id: room.id,
      number: room.number,
      description: room.description || '',
      occupant_count: room.occupant_count || 0,
      occupants: room.occupants ? room.occupants.split(', ').filter(Boolean) : []
    }));

    return createResponse(createPaginatedResponse(formattedRooms, total, limit, offset));

  } catch (error) {
    console.error(`[${requestId}] Error fetching rooms:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}

// POST /api/admin/rooms - Create new room
export async function onRequestPost(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const admin = checkAdminAuth(context.request);
    if (!admin) {
      return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));
    }

    const body = await context.request.json() as Record<string, unknown>;

    // Validate input
    const validation = validate(body, roomCreateSchema);
    if (!validation.valid) {
      return createErrorResponse(errors.validation(validation.errors, requestId));
    }

    const { number, description } = body as { number: string; description?: string };

    // Check if room number already exists
    const { results: existing } = await context.env.DB.prepare(
      'SELECT id FROM rooms WHERE number = ?'
    ).bind(number.trim()).all();

    if (existing.length > 0) {
      return createErrorResponse(errors.conflict('Room number already exists', requestId));
    }

    // Insert new room
    const result = await context.env.DB.prepare(
      'INSERT INTO rooms (number, description) VALUES (?, ?)'
    ).bind(number.trim(), description?.trim() || null).run();

    if (!result.success) {
      throw new Error('Failed to create room');
    }

    return createResponse({
      id: result.meta.last_row_id,
      message: 'Room created successfully'
    }, 201);

  } catch (error) {
    console.error(`[${requestId}] Error creating room:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
