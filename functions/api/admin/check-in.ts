import type { PagesContext } from '../../_shared/types.js';
import { createResponse, checkAdminAuth, handleCORS } from '../../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../_shared/errors.js';
import { getCheckInWindow, checkInWindowError } from '../../_shared/settings.js';

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

// POST /api/admin/check-in — check in or out an attendee by ref number / id.
// Body:
//   ref_number?: string
//   attendee_id?: number
//   action?: 'check_in' | 'check_out'  (defaults to 'check_in')
//   force?: boolean                     (admin override of the time window)
export async function onRequestPost(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));

    const body = await context.request.json() as {
      ref_number?: string;
      attendee_id?: number;
      action?: 'check_in' | 'check_out';
      force?: boolean;
    };
    const ref = body.ref_number;
    const id = body.attendee_id;
    const action = body.action || 'check_in';
    const force = !!body.force;

    if (!ref && !id) {
      return createErrorResponse(errors.badRequest('ref_number or attendee_id required', requestId));
    }

    // Check-in respects the configured window. Check-out is unrestricted —
    // admins always need a way to undo a mistaken check-in.
    if (action === 'check_in' && !force) {
      const window = await getCheckInWindow(context.env.DB);
      const reason = checkInWindowError(window);
      if (reason) {
        return createErrorResponse(errors.badRequest(`${reason} (pass force=true to override)`, requestId));
      }
    }

    const query = ref
      ? 'SELECT id, name, ref_number, checked_in FROM attendees WHERE ref_number = ? AND (is_archived = 0 OR is_archived IS NULL)'
      : 'SELECT id, name, ref_number, checked_in FROM attendees WHERE id = ? AND (is_archived = 0 OR is_archived IS NULL)';
    const bind = ref || id;

    const { results } = await context.env.DB.prepare(query).bind(bind).all();
    if (results.length === 0) return createErrorResponse(errors.notFound('Attendee', requestId));

    const attendee = results[0] as { id: number; name: string; ref_number: string; checked_in: number };

    if (action === 'check_in') {
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
    } else {
      // check_out — clear the flag and timestamp.
      await context.env.DB.prepare(
        'UPDATE attendees SET checked_in = 0, checked_in_at = NULL WHERE id = ?'
      ).bind(attendee.id).run();
    }

    try {
      await context.env.DB.prepare(
        'INSERT INTO audit_log (admin_user, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)'
      ).bind(
        admin.user,
        action,
        'attendee',
        attendee.id,
        JSON.stringify({ ref_number: attendee.ref_number, name: attendee.name, force }),
      ).run();
    } catch (err) {
      console.warn(`[${requestId}] audit_log write failed`, err);
    }

    return createResponse({
      message: action === 'check_in'
        ? `${attendee.name} checked in successfully!`
        : `${attendee.name} check-in undone`,
      already_checked_in: false,
      attendee: { id: attendee.id, name: attendee.name, ref_number: attendee.ref_number },
    });
  } catch (error) {
    console.error(`[${requestId}] Check-in error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}

// GET /api/admin/check-in — stats + recent check-ins + the configured window.
export async function onRequestGet(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));

    const { results: stats } = await context.env.DB.prepare(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN checked_in = 1 THEN 1 ELSE 0 END) AS checked_in,
        SUM(CASE WHEN checked_in = 0 OR checked_in IS NULL THEN 1 ELSE 0 END) AS not_checked_in
      FROM attendees WHERE is_archived = 0 OR is_archived IS NULL
    `).all();

    const { results: recent } = await context.env.DB.prepare(`
      SELECT name, ref_number, checked_in_at
      FROM attendees
      WHERE checked_in = 1 AND (is_archived = 0 OR is_archived IS NULL)
      ORDER BY checked_in_at DESC
      LIMIT 20
    `).all();

    const window = await getCheckInWindow(context.env.DB);
    const window_status = checkInWindowError(window) || 'open';

    return createResponse({
      stats: stats[0],
      recent_checkins: recent,
      window,
      window_status,
    });
  } catch (error) {
    console.error(`[${requestId}] Check-in stats error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
