// GET /api/admin/allergy/:id — full record for one attendee.
// Audit-logged because this is PII.

import type { PagesContext } from '../../../_shared/types.js';
import { createResponse, checkAdminAuth, handleCORS } from '../../../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../../_shared/errors.js';

interface IdParams { id: string; }

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

export async function onRequestGet(context: PagesContext<IdParams>): Promise<Response> {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));

    const id = context.params.id;
    if (!id) return createErrorResponse(errors.badRequest('Attendee id required', requestId));

    const { results } = await context.env.DB.prepare(`
      SELECT
        a.id AS attendee_id, a.name, a.ref_number, a.email, a.date_of_birth,
        r.number AS room_number, g.name AS group_name,
        COALESCE(ar.status, 'none') AS status,
        COALESCE(ar.has_allergies, 0) AS has_allergies,
        ar.allergens, ar.severity, ar.epipen_required, ar.emergency_notes,
        ar.submitted_by_email, ar.submitted_at, ar.form_sent_at
      FROM attendees a
      LEFT JOIN allergy_records ar ON ar.attendee_id = a.id
      LEFT JOIN rooms r ON r.id = a.room_id
      LEFT JOIN groups g ON g.id = a.group_id
      WHERE a.id = ? AND (a.is_archived = 0 OR a.is_archived IS NULL)
    `).bind(id).all();

    if (!results.length) return createErrorResponse(errors.notFound('Attendee', requestId));

    try {
      await context.env.DB.prepare(
        `INSERT INTO audit_log (admin_user, action, entity_type, entity_id, details)
         VALUES (?, 'read', 'allergy', ?, ?)`
      ).bind(admin.user, parseInt(id), JSON.stringify({ at: new Date().toISOString() })).run();
    } catch (err) {
      console.warn(`[${requestId}] audit_log write failed`, err);
    }

    return createResponse(results[0]);
  } catch (error) {
    console.error(`[${requestId}] allergy detail error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
