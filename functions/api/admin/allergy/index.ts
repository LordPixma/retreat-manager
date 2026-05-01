// GET /api/admin/allergy
// Returns one row per non-archived attendee with their allergy-form status
// (none / pending / submitted) and high-level severity for the registry view.

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

    // Audit every read — this is health PII.
    try {
      await context.env.DB.prepare(
        `INSERT INTO audit_log (admin_user, action, entity_type, entity_id, details)
         VALUES (?, 'list', 'allergy', 0, ?)`
      ).bind(admin.user, JSON.stringify({ at: new Date().toISOString() })).run();
    } catch (err) {
      console.warn(`[${requestId}] audit_log write failed`, err);
    }

    const { results } = await context.env.DB.prepare(`
      SELECT
        a.id AS attendee_id,
        a.name,
        a.ref_number,
        a.email,
        a.date_of_birth,
        r.number AS room_number,
        g.name AS group_name,
        COALESCE(ar.status, 'none') AS status,
        COALESCE(ar.has_allergies, 0) AS has_allergies,
        ar.severity,
        ar.epipen_required,
        ar.form_sent_at,
        ar.submitted_at
      FROM attendees a
      LEFT JOIN allergy_records ar ON ar.attendee_id = a.id
      LEFT JOIN rooms r ON r.id = a.room_id
      LEFT JOIN groups g ON g.id = a.group_id
      WHERE a.is_archived = 0 OR a.is_archived IS NULL
      ORDER BY
        CASE ar.severity
          WHEN 'severe' THEN 0
          WHEN 'moderate' THEN 1
          WHEN 'mild' THEN 2
          ELSE 3
        END,
        a.name
    `).all();

    return createResponse({ records: results, count: results.length });
  } catch (error) {
    console.error(`[${requestId}] allergy list error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
