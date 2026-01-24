// Announcements list and create endpoint with TypeScript, validation, and pagination

import type { PagesContext } from '../../../_shared/types.js';
import { createResponse, checkAdminAuth, handleCORS } from '../../../_shared/auth.js';
import { validate, announcementCreateSchema } from '../../../_shared/validation.js';
import { parsePaginationParams, createPaginatedResponse } from '../../../_shared/pagination.js';
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

interface CountResult {
  total: number;
}

// Handle CORS preflight
export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

// GET /api/admin/announcements - List all announcements with pagination
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
      'SELECT COUNT(*) as total FROM announcements'
    ).all();
    const total = (countResult[0] as unknown as CountResult).total;

    // Get announcements with pagination
    const { results } = await context.env.DB.prepare(`
      SELECT
        id,
        title,
        content,
        type,
        priority,
        is_active,
        target_audience,
        target_groups,
        author_name,
        starts_at,
        expires_at,
        created_at,
        updated_at
      FROM announcements
      ORDER BY priority DESC, created_at DESC
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all();

    // Format results
    const formattedAnnouncements = (results as unknown as AnnouncementRow[]).map(announcement => ({
      ...announcement,
      is_active: Boolean(announcement.is_active),
      target_groups: announcement.target_groups ? JSON.parse(announcement.target_groups) : null
    }));

    return createResponse(createPaginatedResponse(formattedAnnouncements, total, limit, offset));

  } catch (error) {
    console.error(`[${requestId}] Error fetching announcements:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}

// POST /api/admin/announcements - Create new announcement
export async function onRequestPost(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));
    }

    const body = await context.request.json() as Record<string, unknown>;

    // Validate input
    const validation = validate(body, announcementCreateSchema);
    if (!validation.valid) {
      return createErrorResponse(errors.validation(validation.errors, requestId));
    }

    const {
      title,
      content,
      type = 'general',
      priority = 1,
      target_audience = 'all',
      target_groups,
      starts_at,
      expires_at
    } = body as {
      title: string;
      content: string;
      type?: string;
      priority?: number;
      target_audience?: string;
      target_groups?: string[];
      starts_at?: string;
      expires_at?: string;
    };

    // Process target groups
    let targetGroupsJson: string | null = null;
    if (target_audience === 'groups' && target_groups && Array.isArray(target_groups)) {
      targetGroupsJson = JSON.stringify(target_groups);
    }

    // Insert new announcement
    const result = await context.env.DB.prepare(`
      INSERT INTO announcements (
        title, content, type, priority, target_audience, target_groups,
        author_name, starts_at, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      title.trim(),
      content.trim(),
      type,
      priority,
      target_audience,
      targetGroupsJson,
      admin.user || 'Admin',
      starts_at || null,
      expires_at || null
    ).run();

    if (!result.success) {
      throw new Error('Failed to create announcement');
    }

    return createResponse({
      id: result.meta.last_row_id,
      message: 'Announcement created successfully'
    }, 201);

  } catch (error) {
    console.error(`[${requestId}] Error creating announcement:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
