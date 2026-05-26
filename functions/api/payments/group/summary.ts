// GET /api/payments/group/summary
//
// Returns the attendee's group, every member of that group, each one's
// outstanding balance, and a flag indicating whether they're already on
// an active payment plan (so the family-pay picker can disable them).
//
// Per design decision: members on an active plan (legacy 3/4 OR flexible)
// are EXCLUDED from group pay — paying their full balance would conflict
// with the plan, so the picker should grey them out with an explanation.

import type { PagesContext } from '../../../_shared/types.js';
import { createResponse, checkAttendeeAuth, handleCORS } from '../../../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../../_shared/errors.js';

interface MemberRow {
  id: number;
  ref_number: string;
  name: string;
  payment_due: number;
  payment_option: string | null;
  group_id: number | null;
  has_active_plan: number;
}

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();
  try {
    const auth = await checkAttendeeAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!auth) return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));

    // Resolve the requesting attendee's group id.
    const { results: meRows } = await context.env.DB.prepare(
      'SELECT id, group_id FROM attendees WHERE ref_number = ?',
    ).bind(auth.ref).all();
    if (!meRows.length) return createErrorResponse(errors.notFound('Attendee', requestId));
    const me = meRows[0] as { id: number; group_id: number | null };

    if (me.group_id === null) {
      return createResponse({ group: null, members: [] });
    }

    const { results: groupRows } = await context.env.DB.prepare(
      'SELECT id, name FROM groups WHERE id = ?',
    ).bind(me.group_id).all();
    if (!groupRows.length) return createResponse({ group: null, members: [] });
    const group = groupRows[0] as { id: number; name: string };

    // Members + plan flags. EXISTS() against both legacy and flexible
    // plan tables, OR-merged into has_active_plan. Single round-trip.
    const { results: memberRows } = await context.env.DB.prepare(`
      SELECT
        a.id, a.ref_number, a.name, a.payment_due, a.payment_option, a.group_id,
        CASE WHEN
          EXISTS (SELECT 1 FROM installment_schedules s WHERE s.attendee_id = a.id AND s.status = 'active')
          OR EXISTS (SELECT 1 FROM flexible_payment_plans p WHERE p.attendee_id = a.id AND p.status = 'active')
        THEN 1 ELSE 0 END AS has_active_plan
      FROM attendees a
      WHERE a.group_id = ?
        AND (a.is_archived = 0 OR a.is_archived IS NULL)
      ORDER BY (a.id = ?) DESC, a.name ASC
    `).bind(me.group_id, me.id).all();

    const members = (memberRows as unknown as MemberRow[]).map((m) => ({
      id: m.id,
      ref_number: m.ref_number,
      name: m.name,
      payment_due_pence: Math.round((m.payment_due || 0) * 100),
      payment_option: m.payment_option,
      is_self: m.id === me.id,
      has_active_plan: m.has_active_plan === 1,
      // True if this member can be included in group pay — owes money,
      // not on sponsorship, no active plan.
      payable: (m.payment_due || 0) > 0
            && (m.payment_option || 'full') !== 'sponsorship'
            && m.has_active_plan !== 1,
    }));

    return createResponse({ group, members });
  } catch (error) {
    console.error(`[${requestId}] group summary error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
