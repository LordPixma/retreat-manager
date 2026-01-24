// Groups list and create endpoint with TypeScript, validation, and pagination

import type { PagesContext } from '../../../_shared/types.js';
import { createResponse, checkAdminAuth, handleCORS } from '../../../_shared/auth.js';
import { validate, groupCreateSchema } from '../../../_shared/validation.js';
import { parsePaginationParams, createPaginatedResponse } from '../../../_shared/pagination.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../../_shared/errors.js';

interface GroupRow {
  id: number;
  name: string;
  member_count: number;
  members: string | null;
  member_refs: string | null;
}

interface CountResult {
  total: number;
}

// Handle CORS preflight
export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

// GET /api/admin/groups - List all groups with pagination
export async function onRequestGet(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));
    }

    const url = new URL(context.request.url);
    const { limit, offset } = parsePaginationParams(url);

    // Get total count
    const { results: countResult } = await context.env.DB.prepare(
      'SELECT COUNT(*) as total FROM groups'
    ).all();
    const total = (countResult[0] as unknown as CountResult).total;

    // Get groups with member information and pagination
    const { results } = await context.env.DB.prepare(`
      SELECT
        g.id,
        g.name,
        COUNT(a.id) as member_count,
        GROUP_CONCAT(a.name, ', ') as members,
        GROUP_CONCAT(a.ref_number, ', ') as member_refs
      FROM groups g
      LEFT JOIN attendees a ON g.id = a.group_id
      GROUP BY g.id, g.name
      ORDER BY g.name
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all();

    const formattedGroups = (results as unknown as GroupRow[]).map(group => {
      const memberNames = group.members ? group.members.split(', ').filter(Boolean) : [];
      const memberRefs = group.member_refs ? group.member_refs.split(', ').filter(Boolean) : [];

      const members = memberNames.map((name, index) => ({
        name,
        ref_number: memberRefs[index] || ''
      }));

      return {
        id: group.id,
        name: group.name,
        member_count: group.member_count || 0,
        members
      };
    });

    return createResponse(createPaginatedResponse(formattedGroups, total, limit, offset));

  } catch (error) {
    console.error(`[${requestId}] Error fetching groups:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}

// POST /api/admin/groups - Create new group
export async function onRequestPost(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));
    }

    const body = await context.request.json() as Record<string, unknown>;

    // Validate input
    const validation = validate(body, groupCreateSchema);
    if (!validation.valid) {
      return createErrorResponse(errors.validation(validation.errors, requestId));
    }

    const { name } = body as { name: string };

    // Check if group name already exists
    const { results: existing } = await context.env.DB.prepare(
      'SELECT id FROM groups WHERE name = ?'
    ).bind(name.trim()).all();

    if (existing.length > 0) {
      return createErrorResponse(errors.conflict('Group name already exists', requestId));
    }

    // Insert new group
    const result = await context.env.DB.prepare(
      'INSERT INTO groups (name) VALUES (?)'
    ).bind(name.trim()).run();

    if (!result.success) {
      throw new Error('Failed to create group');
    }

    return createResponse({
      id: result.meta.last_row_id,
      message: 'Group created successfully'
    }, 201);

  } catch (error) {
    console.error(`[${requestId}] Error creating group:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
