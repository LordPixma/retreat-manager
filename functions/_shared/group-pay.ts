// Shared validation for the group-pay endpoints (card + bank transfer).
//
// Both endpoints take an authenticated attendee + an optional
// `attendee_ids` array and need to:
//
//   1. Resolve the requester's group_id
//   2. Confirm every requested id is in that same group (no cross-family
//      payment — that would be a permission escalation)
//   3. Filter out anyone who can't be paid for (no balance, sponsorship,
//      or already on a plan)
//   4. Sum the per-attendee pence amounts for the Stripe/bank flow
//
// Returns the canonicalised list of payable members so the calling
// endpoint just iterates and creates payment rows.

import type { Env } from './types.js';

export interface PayableMember {
  id: number;
  ref_number: string;
  name: string;
  email: string | null;
  payment_due_pence: number;
  stripe_customer_id: string | null;
}

export interface GroupPayResolution {
  requesterId: number;
  groupId: number;
  groupName: string;
  members: PayableMember[];
  totalPence: number;
}

export class GroupPayError extends Error {
  constructor(public code: 'no_group' | 'no_members_payable' | 'cross_group' | 'not_found', message: string) {
    super(message);
  }
}

/**
 * Resolve which members the authenticated attendee is paying for, with
 * authorization + payability checks.
 *
 * @param requestedIds optional. When undefined OR empty, includes EVERY
 *   payable member of the group. When provided, restricts to ids the
 *   caller listed (still filtered by payability — silently drops ids
 *   that aren't payable so the caller can default-check-all in the UI
 *   without per-row eligibility logic).
 */
export async function resolveGroupPay(
  env: Env,
  attendeeRef: string,
  requestedIds: number[] | undefined,
): Promise<GroupPayResolution> {
  const { results: meRows } = await env.DB.prepare(
    'SELECT id, group_id FROM attendees WHERE ref_number = ?',
  ).bind(attendeeRef).all();
  if (!meRows.length) throw new GroupPayError('not_found', 'Attendee not found');
  const me = meRows[0] as { id: number; group_id: number | null };
  if (me.group_id === null) {
    throw new GroupPayError('no_group', 'You are not in a family group');
  }

  const { results: gRows } = await env.DB.prepare(
    'SELECT id, name FROM groups WHERE id = ?',
  ).bind(me.group_id).all();
  if (!gRows.length) throw new GroupPayError('not_found', 'Group not found');
  const group = gRows[0] as { id: number; name: string };

  // Pull every member of the group plus their plan flags in one query,
  // then filter in memory. Cheaper than per-id queries even for large
  // families and lets us validate cross-group inclusion in the same
  // pass.
  const { results: memberRows } = await env.DB.prepare(`
    SELECT
      a.id, a.ref_number, a.name, a.email, a.payment_due, a.payment_option,
      a.stripe_customer_id,
      CASE WHEN
        EXISTS (SELECT 1 FROM installment_schedules s WHERE s.attendee_id = a.id AND s.status = 'active')
        OR EXISTS (SELECT 1 FROM flexible_payment_plans p WHERE p.attendee_id = a.id AND p.status = 'active')
      THEN 1 ELSE 0 END AS has_active_plan
    FROM attendees a
    WHERE a.group_id = ?
      AND (a.is_archived = 0 OR a.is_archived IS NULL)
  `).bind(me.group_id).all();

  const allMembers = memberRows as unknown as Array<{
    id: number;
    ref_number: string;
    name: string;
    email: string | null;
    payment_due: number;
    payment_option: string | null;
    stripe_customer_id: string | null;
    has_active_plan: number;
  }>;

  // Cross-group guard: if the caller listed ids, every one must be in
  // this group. Refuse otherwise — don't silently drop, that would
  // hide a UI/API bug.
  if (Array.isArray(requestedIds) && requestedIds.length > 0) {
    const groupIds = new Set(allMembers.map((m) => m.id));
    for (const id of requestedIds) {
      if (!groupIds.has(id)) {
        throw new GroupPayError('cross_group', `Attendee ${id} is not in your group`);
      }
    }
  }

  const wantedSet = Array.isArray(requestedIds) && requestedIds.length > 0
    ? new Set(requestedIds)
    : null;

  const payable: PayableMember[] = [];
  for (const m of allMembers) {
    if (wantedSet && !wantedSet.has(m.id)) continue;
    if (m.has_active_plan === 1) continue;
    if ((m.payment_option || 'full') === 'sponsorship') continue;
    const pence = Math.round((m.payment_due || 0) * 100);
    if (pence <= 0) continue;
    payable.push({
      id: m.id,
      ref_number: m.ref_number,
      name: m.name,
      email: m.email,
      payment_due_pence: pence,
      stripe_customer_id: m.stripe_customer_id,
    });
  }

  if (!payable.length) {
    throw new GroupPayError('no_members_payable', 'No selected family members have an outstanding balance to pay');
  }

  const totalPence = payable.reduce((s, m) => s + m.payment_due_pence, 0);

  return {
    requesterId: me.id,
    groupId: group.id,
    groupName: group.name,
    members: payable,
    totalPence,
  };
}
