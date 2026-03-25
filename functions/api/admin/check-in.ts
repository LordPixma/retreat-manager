import type { PagesContext } from '../../_shared/types.js';
import { createResponse, checkAdminAuth, handleCORS } from '../../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../_shared/errors.js';

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

// POST /api/admin/check-in — check in an attendee by ref number
export async function onRequestPost(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));

    const body = await context.request.json() as { ref_number?: string; attendee_id?: number };
    const ref = body.ref_number;
    const id = body.attendee_id;

    if (!ref && !id) {
      return createErrorResponse(errors.badRequest('ref_number or attendee_id required', requestId));
    }

    const query = ref
      ? 'SELECT id, name, ref_number, checked_in FROM attendees WHERE ref_number = ? AND is_archived = 0'
      : 'SELECT id, name, ref_number, checked_in FROM attendees WHERE id = ? AND is_archived = 0';
    const bind = ref || id;

    const { results } = await context.env.DB.prepare(query).bind(bind).all();

    if (results.length === 0) {
      return createErrorResponse(errors.notFound('Attendee', requestId));
    }

    const attendee = results[0] as { id: number; name: string; ref_number: string; checked_in: number };

    if (attendee.checked_in) {
      return createResponse({
        message: `${attendee.name} is already checked in`,
        already_checked_in: true,
        attendee: { id: attendee.id, name: attendee.name, ref_number: attendee.ref_number },
      });
    }

    await context.env.DB.prepare(
      'UPDATE attendees SET checked_in = 1, checked_in_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(attendee.id).run();

    // Log audit
    await context.env.DB.prepare(
      'INSERT INTO audit_log (admin_user, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)'
    ).bind(admin.user, 'check_in', 'attendee', attendee.id, `Checked in ${attendee.name} (${attendee.ref_number})`).run();

    return createResponse({
      message: `${attendee.name} checked in successfully!`,
      already_checked_in: false,
      attendee: { id: attendee.id, name: attendee.name, ref_number: attendee.ref_number },
    });

  } catch (error) {
    console.error(`[${requestId}] Check-in error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}

// GET /api/admin/check-in — get check-in stats
export async function onRequestGet(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));

    const { results: stats } = await context.env.DB.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN checked_in = 1 THEN 1 ELSE 0 END) as checked_in,
        SUM(CASE WHEN checked_in = 0 OR checked_in IS NULL THEN 1 ELSE 0 END) as not_checked_in
      FROM attendees WHERE is_archived = 0
    `).all();

    const { results: recent } = await context.env.DB.prepare(`
      SELECT name, ref_number, checked_in_at
      FROM attendees
      WHERE checked_in = 1 AND is_archived = 0
      ORDER BY checked_in_at DESC
      LIMIT 20
    `).all();

    return createResponse({
      stats: stats[0],
      recent_checkins: recent,
    });

  } catch (error) {
    console.error(`[${requestId}] Check-in stats error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
