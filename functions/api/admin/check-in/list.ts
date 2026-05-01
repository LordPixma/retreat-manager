// GET /api/admin/check-in/list?status=all|in|out&q=search
// Full attendee roster with check-in status. Supports search and filter for
// the admin Check-in tab.

import type { PagesContext } from '../../../_shared/types.js';
import { createResponse, checkAdminAuth, handleCORS } from '../../../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../../_shared/errors.js';

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));

    const url = new URL(context.request.url);
    const status = url.searchParams.get('status') || 'all';
    const q = url.searchParams.get('q')?.trim().toLowerCase() || '';

    const filters: string[] = ['(a.is_archived = 0 OR a.is_archived IS NULL)'];
    const binds: (string | number)[] = [];

    if (status === 'in') filters.push('a.checked_in = 1');
    else if (status === 'out') filters.push('(a.checked_in = 0 OR a.checked_in IS NULL)');

    if (q) {
      filters.push('(LOWER(a.name) LIKE ? OR LOWER(a.ref_number) LIKE ?)');
      binds.push(`%${q}%`, `%${q}%`);
    }

    const where = filters.join(' AND ');
    const stmt = `
      SELECT
        a.id,
        a.ref_number,
        a.name,
        COALESCE(a.checked_in, 0) AS checked_in,
        a.checked_in_at,
        a.emergency_contact,
        r.number AS room_number,
        g.name AS group_name
      FROM attendees a
      LEFT JOIN rooms r ON a.room_id = r.id
      LEFT JOIN groups g ON a.group_id = g.id
      WHERE ${where}
      ORDER BY a.checked_in DESC, a.name
      LIMIT 1000
    `;

    const { results } = await context.env.DB.prepare(stmt).bind(...binds).all();

    return createResponse({
      attendees: results,
      count: results.length,
    });
  } catch (error) {
    console.error(`[${requestId}] check-in list error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
