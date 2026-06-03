// PUT    /api/admin/groups/:id/lead — set attendee_id as the group's lead
// DELETE /api/admin/groups/:id/lead — clear any lead on this group
//
// Admin-only. The lead role lets a single attendee per group edit other
// members' profiles from the attendee portal. We clear the flag on
// every other member of the group whenever we set a new one, so the
// single-lead-per-group invariant is maintained.

import type { PagesContext } from '../../../../_shared/types.js';
import { createResponse, checkAdminAuth, handleCORS } from '../../../../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../../../_shared/errors.js';

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

// GET /api/admin/groups/:id/lead — return the group's members with id,
// name, and is_group_lead so the admin "set lead" modal can render a
// radio list without a separate attendees-by-group call.
export async function onRequestGet(context: PagesContext<{ id: string }>): Promise<Response> {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));

    const groupId = Number(context.params.id);
    if (!Number.isInteger(groupId) || groupId <= 0) {
      return createErrorResponse(errors.badRequest('Invalid group id', requestId));
    }

    const { results } = await context.env.DB.prepare(`
      SELECT id, ref_number, name, COALESCE(is_group_lead, 0) AS is_group_lead
      FROM attendees
      WHERE group_id = ?
        AND (is_archived = 0 OR is_archived IS NULL)
      ORDER BY (COALESCE(is_group_lead, 0) = 1) DESC, name
    `).bind(groupId).all();

    return createResponse({
      group_id: groupId,
      members: (results as unknown as Array<{ id: number; ref_number: string; name: string; is_group_lead: number }>).map((m) => ({
        id: m.id,
        ref_number: m.ref_number,
        name: m.name,
        is_group_lead: m.is_group_lead === 1,
      })),
    });
  } catch (error) {
    console.error(`[${requestId}] group lead list error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}

export async function onRequestPut(context: PagesContext<{ id: string }>): Promise<Response> {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));

    const groupId = Number(context.params.id);
    if (!Number.isInteger(groupId) || groupId <= 0) {
      return createErrorResponse(errors.badRequest('Invalid group id', requestId));
    }

    const body = await context.request.json().catch(() => ({})) as { attendee_id?: number };
    const attendeeId = Number(body.attendee_id);
    if (!Number.isInteger(attendeeId) || attendeeId <= 0) {
      return createErrorResponse(errors.badRequest('attendee_id is required', requestId));
    }

    // Verify the attendee belongs to this group — refuse cross-group
    // assignments so an admin typo can't promote someone in another
    // family to lead.
    const { results: aRows } = await context.env.DB.prepare(
      'SELECT id, group_id, name FROM attendees WHERE id = ?',
    ).bind(attendeeId).all();
    if (!aRows.length) return createErrorResponse(errors.notFound('Attendee', requestId));
    const att = aRows[0] as { id: number; group_id: number | null; name: string };
    if (att.group_id !== groupId) {
      return createErrorResponse(errors.badRequest('Attendee is not in this group', requestId));
    }

    // Single-lead invariant: clear everyone else's flag in this group
    // in the same batch, then set the chosen one. Atomic-ish via D1
    // batch — no other writer touches this column outside this endpoint.
    await context.env.DB.batch([
      context.env.DB.prepare(
        `UPDATE attendees SET is_group_lead = 0 WHERE group_id = ? AND id != ?`,
      ).bind(groupId, attendeeId),
      context.env.DB.prepare(
        `UPDATE attendees SET is_group_lead = 1 WHERE id = ?`,
      ).bind(attendeeId),
    ]);

    try {
      await context.env.DB.prepare(
        `INSERT INTO audit_log (admin_user, action, entity_type, entity_id, details)
         VALUES (?, 'group_lead_set', 'group', ?, ?)`,
      ).bind(admin.user, groupId, JSON.stringify({ attendee_id: attendeeId, name: att.name })).run();
    } catch (err) {
      console.warn(`[${requestId}] audit log write failed`, err);
    }

    return createResponse({ success: true, group_id: groupId, lead_attendee_id: attendeeId });
  } catch (error) {
    console.error(`[${requestId}] set group lead error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}

export async function onRequestDelete(context: PagesContext<{ id: string }>): Promise<Response> {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));

    const groupId = Number(context.params.id);
    if (!Number.isInteger(groupId) || groupId <= 0) {
      return createErrorResponse(errors.badRequest('Invalid group id', requestId));
    }

    await context.env.DB.prepare(
      `UPDATE attendees SET is_group_lead = 0 WHERE group_id = ?`,
    ).bind(groupId).run();

    try {
      await context.env.DB.prepare(
        `INSERT INTO audit_log (admin_user, action, entity_type, entity_id, details)
         VALUES (?, 'group_lead_cleared', 'group', ?, ?)`,
      ).bind(admin.user, groupId, JSON.stringify({})).run();
    } catch (err) {
      console.warn(`[${requestId}] audit log write failed`, err);
    }

    return createResponse({ success: true, group_id: groupId });
  } catch (error) {
    console.error(`[${requestId}] clear group lead error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
