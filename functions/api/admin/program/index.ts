// Admin program management — list all items and create a new one.

import type { PagesContext } from '../../../_shared/types.js';
import { createResponse, checkAdminAuth, handleCORS } from '../../../_shared/auth.js';
import { validate, programItemCreateSchema } from '../../../_shared/validation.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../../_shared/errors.js';

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

// GET /api/admin/program - list every program item in display order.
export async function onRequestGet(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));
    }

    const { results } = await context.env.DB.prepare(`
      SELECT id, event_date, start_time, end_time, day_label, time_label,
             title, description, location, contact_name, event_type, audience,
             priority, is_mandatory, sort_order, created_at, updated_at
      FROM program_items
      ORDER BY event_date ASC, start_time ASC, sort_order ASC, id ASC
    `).all();

    return createResponse({ items: results });
  } catch (error) {
    console.error(`[${requestId}] Error listing program items:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}

// POST /api/admin/program - create a program item. New items default to the
// end of the list (max sort_order + 10) unless an explicit sort_order is given.
export async function onRequestPost(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));
    }

    const body = await context.request.json() as Record<string, unknown>;

    const validation = validate(body, programItemCreateSchema);
    if (!validation.valid) {
      return createErrorResponse(errors.validation(validation.errors, requestId));
    }

    const {
      event_date,
      start_time,
      end_time,
      title,
      description,
      location,
      contact_name,
      event_type,
      audience,
      priority,
      is_mandatory,
      sort_order,
    } = body as {
      event_date: string;
      start_time?: string;
      end_time?: string;
      title: string;
      description?: string;
      location?: string;
      contact_name?: string;
      event_type?: string;
      audience?: string;
      priority?: string;
      is_mandatory?: number | boolean;
      sort_order?: number;
    };

    let order = typeof sort_order === 'number' ? sort_order : null;
    if (order === null) {
      const row = await context.env.DB.prepare(
        'SELECT COALESCE(MAX(sort_order), 0) + 10 AS next FROM program_items'
      ).first<{ next: number }>();
      order = row?.next ?? 10;
    }

    const result = await context.env.DB.prepare(`
      INSERT INTO program_items (
        event_date, start_time, end_time, title, description, location,
        contact_name, event_type, audience, priority, is_mandatory, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      event_date.trim(),
      start_time?.trim() || null,
      end_time?.trim() || null,
      title.trim(),
      description?.trim() || null,
      location?.trim() || null,
      contact_name?.trim() || null,
      // event_type/audience/priority are NOT NULL with DB defaults; never bind null.
      event_type || 'general',
      audience || 'all',
      priority || 'normal',
      // is_mandatory is NOT NULL (0/1); coerce anything truthy to 1.
      is_mandatory ? 1 : 0,
      order,
    ).run();

    if (!result.success) {
      throw new Error('Failed to create program item');
    }

    return createResponse({ id: result.meta.last_row_id, message: 'Program item created' }, 201);
  } catch (error) {
    console.error(`[${requestId}] Error creating program item:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
