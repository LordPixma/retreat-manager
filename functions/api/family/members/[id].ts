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
  email: 200,
  phone: 50,
  emergency_contact: 200,
  dietary_requirements: 1000,
  special_requests: 1000,
};

interface PutBody {
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

    const fields: Array<keyof PutBody> = [
      'name', 'email', 'phone', 'emergency_contact', 'dietary_requirements', 'special_requests',
    ];

    for (const f of fields) {
      const raw = body[f];
      if (raw === undefined) continue;
      const trimmed = (raw ?? '').toString().trim();
      if (trimmed.length > MAX_LEN[f]) {
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
