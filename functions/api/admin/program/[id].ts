// Admin program management — read, update, or delete a single program item.

import type { PagesContext } from '../../../_shared/types.js';
import { createResponse, checkAdminAuth, handleCORS } from '../../../_shared/auth.js';
import { validate, programItemUpdateSchema } from '../../../_shared/validation.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../../_shared/errors.js';

interface IdParams {
  id: string;
}

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

// GET /api/admin/program/:id
export async function onRequestGet(context: PagesContext<IdParams>): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));
    }

    const { results } = await context.env.DB.prepare(
      'SELECT * FROM program_items WHERE id = ?'
    ).bind(context.params.id).all();

    if (!results.length) {
      return createErrorResponse(errors.notFound('Program item', requestId));
    }

    return createResponse(results[0]);
  } catch (error) {
    console.error(`[${requestId}] Error fetching program item:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}

// PUT /api/admin/program/:id - partial update of the provided fields.
export async function onRequestPut(context: PagesContext<IdParams>): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));
    }

    const id = context.params.id;
    const updateData = await context.request.json() as Record<string, unknown>;

    const validation = validate(updateData, programItemUpdateSchema);
    if (!validation.valid) {
      return createErrorResponse(errors.validation(validation.errors, requestId));
    }

    const { results: existing } = await context.env.DB.prepare(
      'SELECT id FROM program_items WHERE id = ?'
    ).bind(id).all();
    if (!existing.length) {
      return createErrorResponse(errors.notFound('Program item', requestId));
    }

    const allowedFields = [
      'event_date', 'start_time', 'end_time', 'title', 'description', 'location',
      'contact_name', 'event_type', 'audience', 'priority',
      'day_label', 'time_label', 'sort_order',
    ];
    // event_type/audience/priority are NOT NULL — never write null to them.
    const notNullFields = new Set(['event_type', 'audience', 'priority']);
    const updateFields: string[] = [];
    const updateValues: (string | number | null)[] = [];

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        if (notNullFields.has(key)) {
          if (value === '' || value === null) continue; // skip rather than null out
          updateFields.push(`${key} = ?`);
          updateValues.push(value as string);
        } else {
          // Empty strings on optional text fields become NULL; sort_order stays numeric.
          updateFields.push(`${key} = ?`);
          updateValues.push(value === '' ? null : (value as string | number | null));
        }
      }
    }

    if (updateFields.length === 0) {
      return createErrorResponse(errors.badRequest('No valid fields to update', requestId));
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(id);

    const result = await context.env.DB.prepare(
      `UPDATE program_items SET ${updateFields.join(', ')} WHERE id = ?`
    ).bind(...updateValues).run();

    if (!result.success) {
      throw new Error('Failed to update program item');
    }

    return createResponse({ success: true, message: 'Program item updated' });
  } catch (error) {
    console.error(`[${requestId}] Error updating program item:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}

// DELETE /api/admin/program/:id
export async function onRequestDelete(context: PagesContext<IdParams>): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));
    }

    const result = await context.env.DB.prepare(
      'DELETE FROM program_items WHERE id = ?'
    ).bind(context.params.id).run();

    if (!result.success || result.meta.changes === 0) {
      return createErrorResponse(errors.notFound('Program item', requestId));
    }

    return createResponse({ success: true, message: 'Program item deleted' });
  } catch (error) {
    console.error(`[${requestId}] Error deleting program item:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
