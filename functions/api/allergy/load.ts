// GET /api/allergy/load?token=...
// Public endpoint: validates the form token and returns the attendee name +
// any previously-submitted allergy data so the form can pre-populate.
//
// No auth header required — the signed token is the auth.

import type { PagesContext } from '../../_shared/types.js';
import { createResponse, handleCORS, verifyAllergyFormToken } from '../../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../_shared/errors.js';

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();
  try {
    const url = new URL(context.request.url);
    const token = url.searchParams.get('token') || '';
    if (!token) return createErrorResponse(errors.badRequest('Missing token', requestId));

    const secret = context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET;
    const payload = await verifyAllergyFormToken(token, secret);
    if (!payload) return createErrorResponse(errors.unauthorized('Invalid or expired link', requestId));

    const { results } = await context.env.DB.prepare(`
      SELECT a.id, a.name, a.ref_number,
             ar.status, ar.has_allergies, ar.allergens, ar.severity,
             ar.epipen_required, ar.emergency_notes, ar.submitted_at
      FROM attendees a
      LEFT JOIN allergy_records ar ON ar.attendee_id = a.id
      WHERE a.id = ? AND (a.is_archived = 0 OR a.is_archived IS NULL)
    `).bind(payload.attendee_id).all();

    if (!results.length) return createErrorResponse(errors.notFound('Attendee', requestId));
    const r = results[0] as Record<string, unknown>;

    return createResponse({
      attendee: {
        id: r.id,
        name: r.name,
        ref_number: r.ref_number,
      },
      record: r.status ? {
        status: r.status,
        has_allergies: !!r.has_allergies,
        allergens: r.allergens || '',
        severity: r.severity || '',
        epipen_required: !!r.epipen_required,
        emergency_notes: r.emergency_notes || '',
        submitted_at: r.submitted_at,
      } : null,
    });
  } catch (error) {
    console.error(`[${requestId}] allergy/load error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
