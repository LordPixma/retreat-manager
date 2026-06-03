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

const MAX_LEN: Record<string, number> = {
  name: 100,
  first_name: 60,
  last_name: 60,
  preferred_name: 60,
  email: 200,
  phone: 50,
  emergency_contact: 200,
  postal_address: 500,
  dietary_requirements: 1000,
  medical_conditions: 1000,
  accessibility_needs: 1000,
  special_requests: 1000,
  tshirt_size: 20,
  arrival_method: 40,
  vehicle_registration: 20,
  date_of_birth: 10,        /* YYYY-MM-DD */
};

interface ProfileBody {
  name?: string;
  first_name?: string;
  last_name?: string;
  preferred_name?: string;
  email?: string;
  phone?: string;
  emergency_contact?: string;
  postal_address?: string;
  dietary_requirements?: string;
  medical_conditions?: string;
  accessibility_needs?: string;
  special_requests?: string;
  tshirt_size?: string;
  arrival_method?: string;
  vehicle_registration?: string;
  date_of_birth?: string;
}

const EDITABLE_FIELDS: Array<keyof ProfileBody> = [
  'name', 'first_name', 'last_name', 'preferred_name',
  'email', 'phone', 'emergency_contact', 'postal_address',
  'dietary_requirements', 'medical_conditions', 'accessibility_needs', 'special_requests',
  'tshirt_size', 'arrival_method', 'vehicle_registration', 'date_of_birth',
];

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

    const cleaned: Partial<Record<keyof ProfileBody, string | null>> = {};

    for (const f of EDITABLE_FIELDS) {
      const raw = body[f];
      if (raw === undefined) continue;
      const trimmed = (raw ?? '').toString().trim();
      if (trimmed.length > (MAX_LEN[f] ?? 1000)) {
        return createErrorResponse(errors.badRequest(`${f} is too long (max ${MAX_LEN[f]} chars)`, requestId));
      }
      // name/first_name/last_name can't be cleared to empty — they're identity.
      if ((f === 'name' || f === 'first_name' || f === 'last_name') && trimmed.length === 0) {
        return createErrorResponse(errors.badRequest(`${f} cannot be empty`, requestId));
      }
      if (f === 'email' && trimmed.length > 0 && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed)) {
        return createErrorResponse(errors.badRequest('Email is not valid', requestId));
      }
      if (f === 'date_of_birth' && trimmed.length > 0) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
          return createErrorResponse(errors.badRequest('date_of_birth must be YYYY-MM-DD', requestId));
        }
        // Sanity: not in the future, not before 1900.
        const d = new Date(trimmed + 'T00:00:00Z');
        if (isNaN(d.getTime()) || d.getUTCFullYear() < 1900 || d.getTime() > Date.now()) {
          return createErrorResponse(errors.badRequest('date_of_birth is out of range', requestId));
        }
      }
      cleaned[f] = trimmed.length === 0 && !(f === 'name' || f === 'first_name' || f === 'last_name')
        ? null
        : trimmed;
    }

    // If first/last were edited, regenerate the canonical `name` so all
    // existing UIs (admin lists, emails, CSV exports) that read `name`
    // stay in sync. Only re-derives when the caller didn't submit `name`
    // explicitly themselves.
    if (cleaned.name === undefined && (cleaned.first_name !== undefined || cleaned.last_name !== undefined)) {
      const { results: currRows } = await context.env.DB.prepare(
        'SELECT first_name, last_name FROM attendees WHERE ref_number = ?',
      ).bind(auth.ref).all();
      if (currRows.length) {
        const curr = currRows[0] as { first_name: string | null; last_name: string | null };
        const fn = (cleaned.first_name ?? curr.first_name ?? '').toString().trim();
        const ln = (cleaned.last_name ?? curr.last_name ?? '').toString().trim();
        const combined = `${fn} ${ln}`.trim();
        if (combined.length > 0) cleaned.name = combined;
      }
    }

    for (const [k, v] of Object.entries(cleaned)) {
      updates.push(`${k} = ?`);
      binds.push(v);
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
