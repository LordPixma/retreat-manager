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
      SELECT id, day_label, time_label, title, description, location, sort_order, created_at, updated_at
      FROM program_items
      ORDER BY sort_order ASC, id ASC
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
      day_label,
      time_label,
      title,
      description,
      location,
      sort_order,
    } = body as {
      day_label: string;
      time_label?: string;
      title: string;
      description?: string;
      location?: string;
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
      INSERT INTO program_items (day_label, time_label, title, description, location, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      day_label.trim(),
      time_label?.trim() || null,
      title.trim(),
      description?.trim() || null,
      location?.trim() || null,
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
