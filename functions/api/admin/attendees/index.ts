// Attendees list and create endpoint with TypeScript, validation, and pagination

import type { PagesContext } from '../../../_shared/types.js';
import { createResponse, checkAdminAuth, handleCORS, hashPassword } from '../../../_shared/auth.js';
import { validate, attendeeCreateSchema } from '../../../_shared/validation.js';
import { parsePaginationParams, createPaginatedResponse } from '../../../_shared/pagination.js';
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
  group_name: string | null;
}

interface CountResult {
  total: number;
}

// Handle CORS preflight
export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

// GET /api/admin/attendees - List all attendees with pagination
export async function onRequestGet(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();

  try {
    // Check admin authorization
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));
    }

    const url = new URL(context.request.url);
    const { limit, offset } = parsePaginationParams(url);

    // Get total count
    const { results: countResult } = await context.env.DB.prepare(
      'SELECT COUNT(*) as total FROM attendees'
    ).all();
    const total = (countResult[0] as unknown as CountResult).total;

    // Query attendees with pagination
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
        g.name AS group_name
      FROM attendees a
      LEFT JOIN rooms r ON a.room_id = r.id
      LEFT JOIN groups g ON a.group_id = g.id
      ORDER BY a.name
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all();

    // Format the response
    const formattedResults = (results as unknown as AttendeeRow[]).map(attendee => ({
      id: attendee.id,
      ref_number: attendee.ref_number,
      name: attendee.name,
      email: attendee.email,
      payment_due: attendee.payment_due || 0,
      room_id: attendee.room_id,
      group_id: attendee.group_id,
      room: attendee.room_number ? { number: attendee.room_number } : null,
      group: attendee.group_name ? { name: attendee.group_name } : null
    }));

    return createResponse(createPaginatedResponse(formattedResults, total, limit, offset));

  } catch (error) {
    console.error(`[${requestId}] Error fetching attendees:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}

// POST /api/admin/attendees - Create new attendee
export async function onRequestPost(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();

  try {
    // Check admin authorization
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));
    }

    const body = await context.request.json() as Record<string, unknown>;

    // Validate input
    const validation = validate(body, attendeeCreateSchema);
    if (!validation.valid) {
      return createErrorResponse(errors.validation(validation.errors, requestId));
    }

    const { name, email, ref_number, password, room_id, group_id, payment_due } = body as {
      name: string;
      email?: string;
      ref_number: string;
      password: string;
      room_id?: number | null;
      group_id?: number | null;
      payment_due?: number;
    };

    // Check if reference number already exists
    const { results: existing } = await context.env.DB.prepare(
      'SELECT id FROM attendees WHERE ref_number = ?'
    ).bind((ref_number as string).trim()).all();

    if (existing.length > 0) {
      return createErrorResponse(errors.conflict('Reference number already exists', requestId));
    }

    // Hash password
    const password_hash = await hashPassword(password as string);

    // Insert new attendee
    const result = await context.env.DB.prepare(`
      INSERT INTO attendees (name, email, ref_number, password_hash, room_id, group_id, payment_due)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      (name as string).trim(),
      email ? (email as string).trim() : null,
      (ref_number as string).trim(),
      password_hash,
      room_id ?? null,
      group_id ?? null,
      payment_due ?? 0
    ).run();

    if (!result.success) {
      throw new Error('Failed to create attendee');
    }

    return createResponse({
      id: result.meta.last_row_id,
      message: 'Attendee created successfully'
    }, 201);

  } catch (error) {
    console.error(`[${requestId}] Error creating attendee:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
