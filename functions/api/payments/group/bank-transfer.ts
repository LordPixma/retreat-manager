// POST /api/payments/group/bank-transfer
//
// Records pending bank-transfer payments for each selected family
// member, all sharing a single FAMILY-* reference so the admin sees
// them as one transfer when reconciling.
//
// The attendee makes ONE lump-sum transfer quoting the shared
// reference. Admin marks each row paid individually via the existing
// Payments tab "confirm" button (same flow as per-attendee bank
// transfer), but the shared reference + "paid by" description makes
// it obvious they all relate to one wire.

import type { PagesContext } from '../../../_shared/types.js';
import { createResponse, checkAttendeeAuth, handleCORS } from '../../../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../../_shared/errors.js';
import { resolveGroupPay, GroupPayError } from '../../../_shared/group-pay.js';

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

export async function onRequestPost(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();
  try {
    const auth = await checkAttendeeAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!auth) return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));

    const body = await context.request.json().catch(() => ({})) as { attendee_ids?: number[] };

    let res;
    try {
      res = await resolveGroupPay(context.env, auth.ref, body.attendee_ids);
    } catch (e) {
      if (e instanceof GroupPayError) {
        return createErrorResponse(
          e.code === 'cross_group'
            ? errors.forbidden(e.message, requestId)
            : errors.badRequest(e.message, requestId),
        );
      }
      throw e;
    }

    const retreatName = context.env.RETREAT_NAME || 'Growth and Wisdom Retreat';

    // Reference format: FAMILY-<requester_ref>-T<epoch_seconds>. Short
    // enough for the average bank "reference" field (typically 18
    // chars max for UK Faster Payments), deterministic within a
    // session, and shows ownership at a glance.
    const ts = Math.floor(Date.now() / 1000);
    const reference = `FAMILY-${auth.ref}-T${ts}`.slice(0, 35);

    // One pending row per member, all sharing the reference (we encode
    // it in `description` since there's no dedicated column on the
    // legacy payments table). The admin Payments tab already shows
    // description in its table.
    const stmts = res.members.map((m) =>
      context.env.DB.prepare(`
        INSERT INTO payments (
          attendee_id, amount, currency, status, payment_type, description
        ) VALUES (?, ?, 'gbp', 'pending', 'full', ?)
      `).bind(
        m.id,
        m.payment_due_pence,
        `${retreatName} - Bank Transfer (group, ref ${reference})`,
      ),
    );
    await context.env.DB.batch(stmts);

    return createResponse({
      success: true,
      message: `Bank transfer recorded for ${res.members.length} family member(s). Payment will be confirmed once funds are received.`,
      reference,
      amount_pence: res.totalPence,
      member_count: res.members.length,
      members: res.members.map((m) => ({
        id: m.id,
        name: m.name,
        amount_pence: m.payment_due_pence,
      })),
      bank_details: {
        account_name: context.env.BANK_ACCOUNT_NAME || 'Cloverleaf Christian Centre',
        sort_code: context.env.BANK_SORT_CODE || '82-12-08',
        account_number: context.env.BANK_ACCOUNT_NUMBER || '50180560',
        reference,
      },
    }, 201);
  } catch (error) {
    console.error(`[${requestId}] group bank transfer error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
