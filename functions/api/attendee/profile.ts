// PUT /api/attendee/profile
//
// Self-service profile edit. Attendees update their own contact,
// dietary, allergy, and emergency fields from the "My Details" view.
//
// Display name is editable here too — there's no real audit risk since
// admins can always see / overwrite from their dashboard, and people
// fix typos in their own names.
//
// Fields NOT editable here (handled elsewhere):
//   - payment_due / payment_status (payments flow)
//   - room_id / group_id (admin only)
//   - is_group_lead (admin only)
//   - ref_number (immutable identity)

import type { PagesContext } from '../../_shared/types.js';
import { createResponse, checkAttendeeAuth, handleCORS } from '../../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../_shared/errors.js';

const MAX_LEN = {
  name: 100,
  email: 200,
  phone: 50,
  emergency_contact: 200,
  dietary_requirements: 1000,
  special_requests: 1000,
};

interface ProfileBody {
  name?: string;
  email?: string;
  phone?: string;
  emergency_contact?: string;
  dietary_requirements?: string;
  special_requests?: string;
}

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

export async function onRequestPut(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();
  try {
    const auth = await checkAttendeeAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!auth) return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));

    const body = await context.request.json().catch(() => ({})) as ProfileBody;

    // Build the SET clause dynamically so unset keys aren't overwritten
    // with null. Each accepted field is trimmed + length-clamped here so
    // the storage layer never has to defend itself.
    const updates: string[] = [];
    const binds: (string | null)[] = [];

    const fields: Array<keyof ProfileBody> = [
      'name', 'email', 'phone', 'emergency_contact', 'dietary_requirements', 'special_requests',
    ];

    for (const f of fields) {
      const raw = body[f];
      if (raw === undefined) continue;
      const trimmed = (raw ?? '').toString().trim();
      if (trimmed.length > (MAX_LEN[f] ?? 1000)) {
        return createErrorResponse(errors.badRequest(`${f} is too long (max ${MAX_LEN[f]} chars)`, requestId));
      }
      if (f === 'name' && trimmed.length === 0) {
        return createErrorResponse(errors.badRequest('Name cannot be empty', requestId));
      }
      if (f === 'email' && trimmed.length > 0 && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed)) {
        return createErrorResponse(errors.badRequest('Email is not valid', requestId));
      }
      updates.push(`${f} = ?`);
      binds.push(trimmed.length === 0 && f !== 'name' ? null : trimmed);
    }

    if (!updates.length) {
      return createErrorResponse(errors.badRequest('No editable fields provided', requestId));
    }

    const sql = `UPDATE attendees SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE ref_number = ?`;
    const result = await context.env.DB.prepare(sql).bind(...binds, auth.ref).run();

    if (!result.meta || (result.meta.changes ?? 0) === 0) {
      return createErrorResponse(errors.notFound('Attendee', requestId));
    }

    return createResponse({ success: true, updated_fields: updates.length });
  } catch (error) {
    console.error(`[${requestId}] attendee profile update error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
