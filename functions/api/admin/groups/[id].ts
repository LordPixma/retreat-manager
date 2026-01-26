// Individual group operations with TypeScript and validation

import type { PagesContext } from '../../../_shared/types.js';
import { createResponse, checkAdminAuth, handleCORS } from '../../../_shared/auth.js';
import { validate, groupUpdateSchema } from '../../../_shared/validation.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../../_shared/errors.js';

interface GroupRow {
  id: number;
  name: string;
  member_count: number;
  members: string | null;
  member_refs: string | null;
}

interface IdParams {
  id: string;
}

// Handle CORS preflight
export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

// GET /api/admin/groups/:id - Get single group
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
        g.id,
        g.name,
        COUNT(a.id) as member_count,
        GROUP_CONCAT(a.name, ', ') as members,
        GROUP_CONCAT(a.ref_number, ', ') as member_refs
      FROM groups g
      LEFT JOIN attendees a ON g.id = a.group_id
      WHERE g.id = ?
      GROUP BY g.id, g.name
    `).bind(id).all();

    if (!results.length) {
      return createErrorResponse(errors.notFound('Group', requestId));
    }

    const group = results[0] as unknown as GroupRow;
    const memberNames = group.members ? group.members.split(', ').filter(Boolean) : [];
    const memberRefs = group.member_refs ? group.member_refs.split(', ').filter(Boolean) : [];

    const members = memberNames.map((name, index) => ({
      name,
      ref_number: memberRefs[index] || ''
    }));

    const formattedGroup = {
      id: group.id,
      name: group.name,
      member_count: group.member_count || 0,
      members
    };

    return createResponse(formattedGroup);

  } catch (error) {
    console.error(`[${requestId}] Error fetching group:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}

// PUT /api/admin/groups/:id - Update group
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
    const validation = validate(body, groupUpdateSchema);
    if (!validation.valid) {
      return createErrorResponse(errors.validation(validation.errors, requestId));
    }

    const { name } = body as { name?: string };

    if (!name || !name.trim()) {
      return createErrorResponse(errors.badRequest('Group name is required', requestId));
    }

    // Check if group exists
    const { results: existing } = await context.env.DB.prepare(
      'SELECT id FROM groups WHERE id = ?'
    ).bind(id).all();

    if (!existing.length) {
      return createErrorResponse(errors.notFound('Group', requestId));
    }

    // Check if new name conflicts with another group
    const { results: conflict } = await context.env.DB.prepare(
      'SELECT id FROM groups WHERE name = ? AND id != ?'
    ).bind(name.trim(), id).all();

    if (conflict.length > 0) {
      return createErrorResponse(errors.conflict('Group name already exists', requestId));
    }

    // Update group
    const result = await context.env.DB.prepare(
      'UPDATE groups SET name = ? WHERE id = ?'
    ).bind(name.trim(), id).run();

    if (!result.success) {
      throw new Error('Failed to update group');
    }

    return createResponse({
      success: true,
      message: 'Group updated successfully'
    });

  } catch (error) {
    console.error(`[${requestId}] Error updating group:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}

// DELETE /api/admin/groups/:id - Delete group
export async function onRequestDelete(context: PagesContext<IdParams>): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));
    }

    const id = context.params.id;

    // Check if group exists
    const { results: existing } = await context.env.DB.prepare(
      'SELECT id, name FROM groups WHERE id = ?'
    ).bind(id).all();

    if (!existing.length) {
      return createErrorResponse(errors.notFound('Group', requestId));
    }

    const group = existing[0] as unknown as { id: number; name: string };

    // Check if group has members
    const { results: members } = await context.env.DB.prepare(
      'SELECT COUNT(*) as count FROM attendees WHERE group_id = ?'
    ).bind(id).all();

    if ((members[0] as unknown as { count: number }).count > 0) {
      return createErrorResponse(
        errors.conflict('Cannot delete group with members. Please reassign attendees first.', requestId)
      );
    }

    // Delete group
    const result = await context.env.DB.prepare(
      'DELETE FROM groups WHERE id = ?'
    ).bind(id).run();

    if (!result.success) {
      throw new Error('Failed to delete group');
    }

    return createResponse({
      success: true,
      message: `Group ${group.name} deleted successfully`
    });

  } catch (error) {
    console.error(`[${requestId}] Error deleting group:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
