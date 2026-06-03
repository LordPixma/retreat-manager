// PUT /api/family/members/:id
//
// Lead-only edit of another family member's profile. Validates:
//   1. requester is logged in as an attendee
//   2. requester is_group_lead = 1
//   3. target attendee is in the requester's group
//
// Editable fields mirror /api/attendee/profile so a lead has the same
// surface as the attendee editing themselves. ref_number, group_id,
// is_group_lead, room_id, and payment fields stay admin-only.
//
// Self-edit goes through /api/attendee/profile rather than this
// endpoint — the lead path is for OTHERS in the group only. Refusing
// self here makes the lead-check more meaningful (you can't accidentally
// promote a self-edit into a lead operation).

import type { PagesContext } from '../../../_shared/types.js';
import { createResponse, checkAttendeeAuth, handleCORS } from '../../../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../../_shared/errors.js';

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
  date_of_birth: 10,
};

interface PutBody {
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

const EDITABLE_FIELDS: Array<keyof PutBody> = [
  'name', 'first_name', 'last_name', 'preferred_name',
  'email', 'phone', 'emergency_contact', 'postal_address',
  'dietary_requirements', 'medical_conditions', 'accessibility_needs', 'special_requests',
  'tshirt_size', 'arrival_method', 'vehicle_registration', 'date_of_birth',
];

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

export async function onRequestPut(context: PagesContext<{ id: string }>): Promise<Response> {
  const requestId = generateRequestId();
  try {
    const auth = await checkAttendeeAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!auth) return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));

    const targetId = Number(context.params.id);
    if (!Number.isInteger(targetId) || targetId <= 0) {
      return createErrorResponse(errors.badRequest('Invalid member id', requestId));
    }

    const { results: meRows } = await context.env.DB.prepare(
      'SELECT id, group_id, COALESCE(is_group_lead, 0) AS is_group_lead FROM attendees WHERE ref_number = ?',
    ).bind(auth.ref).all();
    if (!meRows.length) return createErrorResponse(errors.notFound('Attendee', requestId));
    const me = meRows[0] as { id: number; group_id: number | null; is_group_lead: number };

    if (me.is_group_lead !== 1) {
      return createErrorResponse(errors.forbidden('Only the family lead can edit other members. Use My Details to edit your own profile.', requestId));
    }
    if (me.id === targetId) {
      return createErrorResponse(errors.badRequest('Use /api/attendee/profile to edit your own profile', requestId));
    }
    if (me.group_id === null) {
      return createErrorResponse(errors.badRequest('You are not in a group', requestId));
    }

    const { results: targetRows } = await context.env.DB.prepare(
      'SELECT id, group_id FROM attendees WHERE id = ?',
    ).bind(targetId).all();
    if (!targetRows.length) return createErrorResponse(errors.notFound('Family member', requestId));
    const target = targetRows[0] as { id: number; group_id: number | null };
    if (target.group_id !== me.group_id) {
      // Don't leak existence of an out-of-group id.
      return createErrorResponse(errors.notFound('Family member', requestId));
    }

    const body = await context.request.json().catch(() => ({})) as PutBody;
    const updates: string[] = [];
    const binds: (string | null)[] = [];

    const cleaned: Partial<Record<keyof PutBody, string | null>> = {};

    for (const f of EDITABLE_FIELDS) {
      const raw = body[f];
      if (raw === undefined) continue;
      const trimmed = (raw ?? '').toString().trim();
      if (trimmed.length > MAX_LEN[f]) {
        return createErrorResponse(errors.badRequest(`${f} is too long (max ${MAX_LEN[f]} chars)`, requestId));
      }
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
        const d = new Date(trimmed + 'T00:00:00Z');
        if (isNaN(d.getTime()) || d.getUTCFullYear() < 1900 || d.getTime() > Date.now()) {
          return createErrorResponse(errors.badRequest('date_of_birth is out of range', requestId));
        }
      }
      cleaned[f] = trimmed.length === 0 && !(f === 'name' || f === 'first_name' || f === 'last_name')
        ? null
        : trimmed;
    }

    // Sync canonical `name` from first/last if the caller edited them.
    if (cleaned.name === undefined && (cleaned.first_name !== undefined || cleaned.last_name !== undefined)) {
      const { results: currRows } = await context.env.DB.prepare(
        'SELECT first_name, last_name FROM attendees WHERE id = ?',
      ).bind(targetId).all();
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

    const sql = `UPDATE attendees SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    const result = await context.env.DB.prepare(sql).bind(...binds, targetId).run();

    if (!result.meta || (result.meta.changes ?? 0) === 0) {
      return createErrorResponse(errors.notFound('Family member', requestId));
    }

    // Audit log (best-effort) — lead edits on others should be traceable.
    try {
      await context.env.DB.prepare(
        `INSERT INTO audit_log (admin_user, action, entity_type, entity_id, details)
         VALUES (?, 'family_lead_member_edit', 'attendee', ?, ?)`,
      ).bind(
        auth.ref,                                      /* lead's ref_number, not an admin */
        targetId,
        JSON.stringify({ updated_fields: updates.map((u) => u.split(' = ')[0]) }),
      ).run();
    } catch (err) {
      console.warn(`[${requestId}] audit log write failed`, err);
    }

    return createResponse({ success: true, updated_fields: updates.length });
  } catch (error) {
    console.error(`[${requestId}] family member edit error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
