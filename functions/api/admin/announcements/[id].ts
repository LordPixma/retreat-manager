// Individual announcement operations with TypeScript and validation

import type { PagesContext } from '../../../_shared/types.js';
import { createResponse, checkAdminAuth, handleCORS } from '../../../_shared/auth.js';
import { validate, announcementUpdateSchema } from '../../../_shared/validation.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../../_shared/errors.js';

interface AnnouncementRow {
  id: number;
  title: string;
  content: string;
  type: string;
  priority: number;
  is_active: number;
  target_audience: string;
  target_groups: string | null;
  author_name: string;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

interface IdParams {
  id: string;
}

// Handle CORS preflight
export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

// GET /api/admin/announcements/:id - Get single announcement
export async function onRequestGet(context: PagesContext<IdParams>): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const admin = checkAdminAuth(context.request);
    if (!admin) {
      return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));
    }

    const id = context.params.id;

    const { results } = await context.env.DB.prepare(
      'SELECT * FROM announcements WHERE id = ?'
    ).bind(id).all();

    if (!results.length) {
      return createErrorResponse(errors.notFound('Announcement', requestId));
    }

    const announcement = results[0] as unknown as AnnouncementRow;
    return createResponse({
      ...announcement,
      is_active: Boolean(announcement.is_active),
      target_groups: announcement.target_groups ? JSON.parse(announcement.target_groups) : null
    });

  } catch (error) {
    console.error(`[${requestId}] Error fetching announcement:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}

// PUT /api/admin/announcements/:id - Update announcement
export async function onRequestPut(context: PagesContext<IdParams>): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const admin = checkAdminAuth(context.request);
    if (!admin) {
      return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));
    }

    const id = context.params.id;
    const updateData = await context.request.json() as Record<string, unknown>;

    // Validate input
    const validation = validate(updateData, announcementUpdateSchema);
    if (!validation.valid) {
      return createErrorResponse(errors.validation(validation.errors, requestId));
    }

    // Check if announcement exists
    const { results: existing } = await context.env.DB.prepare(
      'SELECT id FROM announcements WHERE id = ?'
    ).bind(id).all();

    if (!existing.length) {
      return createErrorResponse(errors.notFound('Announcement', requestId));
    }

    // Build dynamic UPDATE query
    const allowedFields = [
      'title', 'content', 'type', 'priority', 'is_active',
      'target_audience', 'target_groups', 'starts_at', 'expires_at'
    ];
    const updateFields: string[] = [];
    const updateValues: (string | number | null)[] = [];

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        if (key === 'target_groups' && Array.isArray(value)) {
          updateFields.push(`${key} = ?`);
          updateValues.push(JSON.stringify(value));
        } else if (key === 'is_active') {
          updateFields.push(`${key} = ?`);
          updateValues.push(value ? 1 : 0);
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

    const updateQuery = `UPDATE announcements SET ${updateFields.join(', ')} WHERE id = ?`;
    const result = await context.env.DB.prepare(updateQuery).bind(...updateValues).run();

    if (!result.success) {
      throw new Error('Failed to update announcement');
    }

    return createResponse({
      success: true,
      message: 'Announcement updated successfully'
    });

  } catch (error) {
    console.error(`[${requestId}] Error updating announcement:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}

// DELETE /api/admin/announcements/:id - Delete announcement
export async function onRequestDelete(context: PagesContext<IdParams>): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const admin = checkAdminAuth(context.request);
    if (!admin) {
      return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));
    }

    const id = context.params.id;

    // Check if announcement exists
    const { results: existing } = await context.env.DB.prepare(
      'SELECT id, title FROM announcements WHERE id = ?'
    ).bind(id).all();

    if (!existing.length) {
      return createErrorResponse(errors.notFound('Announcement', requestId));
    }

    const announcement = existing[0] as { id: number; title: string };

    // Delete the announcement
    const result = await context.env.DB.prepare(
      'DELETE FROM announcements WHERE id = ?'
    ).bind(id).run();

    if (!result.success) {
      throw new Error('Failed to delete announcement');
    }

    return createResponse({
      success: true,
      message: `Announcement "${announcement.title}" deleted successfully`
    });

  } catch (error) {
    console.error(`[${requestId}] Error deleting announcement:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
