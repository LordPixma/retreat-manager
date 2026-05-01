// POST /api/allergy/submit
// Public endpoint guarded by signed token. Persists the recipient's response
// in `allergy_records` (one row per attendee, upsert-style).

import type { PagesContext } from '../../_shared/types.js';
import { createResponse, handleCORS, verifyAllergyFormToken } from '../../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../_shared/errors.js';

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

interface AllergyFormBody {
  token: string;
  has_allergies: boolean;
  allergens?: string;
  severity?: 'mild' | 'moderate' | 'severe' | '';
  epipen_required?: boolean;
  emergency_notes?: string;
  submitted_by_email?: string;
}

const VALID_SEVERITIES = ['mild', 'moderate', 'severe'] as const;

export async function onRequestPost(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();
  try {
    const body = await context.request.json() as AllergyFormBody;
    if (!body.token) return createErrorResponse(errors.badRequest('Missing token', requestId));

    const secret = context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET;
    const payload = await verifyAllergyFormToken(body.token, secret);
    if (!payload) return createErrorResponse(errors.unauthorized('Invalid or expired link', requestId));

    const has = body.has_allergies === true;
    const severity = has && body.severity && VALID_SEVERITIES.includes(body.severity as typeof VALID_SEVERITIES[number])
      ? body.severity
      : null;

    if (has && (!body.allergens || !body.allergens.trim())) {
      return createErrorResponse(errors.badRequest('Please describe the allergens', requestId));
    }

    // Verify the attendee still exists / isn't archived.
    const { results: existing } = await context.env.DB.prepare(
      'SELECT id FROM attendees WHERE id = ? AND (is_archived = 0 OR is_archived IS NULL)'
    ).bind(payload.attendee_id).all();
    if (!existing.length) return createErrorResponse(errors.notFound('Attendee', requestId));

    const status = has ? 'submitted' : 'none';

    // Upsert via INSERT ... ON CONFLICT (UNIQUE on attendee_id).
    await context.env.DB.prepare(`
      INSERT INTO allergy_records (
        attendee_id, status, has_allergies, allergens, severity,
        epipen_required, emergency_notes, submitted_by_email,
        submitted_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(attendee_id) DO UPDATE SET
        status = excluded.status,
        has_allergies = excluded.has_allergies,
        allergens = excluded.allergens,
        severity = excluded.severity,
        epipen_required = excluded.epipen_required,
        emergency_notes = excluded.emergency_notes,
        submitted_by_email = excluded.submitted_by_email,
        submitted_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    `).bind(
      payload.attendee_id,
      status,
      has ? 1 : 0,
      has ? (body.allergens?.trim() || null) : null,
      severity,
      has && body.epipen_required ? 1 : 0,
      has ? (body.emergency_notes?.trim() || null) : null,
      body.submitted_by_email?.trim() || null,
    ).run();

    return createResponse({ success: true, status });
  } catch (error) {
    console.error(`[${requestId}] allergy/submit error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
