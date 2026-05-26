// POST /api/payments/group/checkout
//
// Family-pay via Stripe. One Checkout session covers the selected
// members' total outstanding balance; pre-records one pending payments
// row per member sharing the session id. The webhook (see
// /api/webhooks/stripe.ts handleGroupCheckoutCompleted) finds them all
// by session id and credits each attendee's balance individually.
//
// The Stripe customer used is the REQUESTING attendee's customer
// record — they're the one being charged. Per-member payments rows
// reference each member's own attendee_id so receipts and admin views
// stay attributable.
//
// Body: { attendee_ids?: number[] }  (omit/empty = pay for everyone payable)

import type { PagesContext } from '../../../_shared/types.js';
import { createResponse, checkAttendeeAuth, handleCORS } from '../../../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../../_shared/errors.js';
import { getStripe, createStripeCustomer, createCheckoutSession } from '../../../_shared/stripe.js';
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

    const stripe = getStripe(context.env);
    const portalUrl = context.env.PORTAL_URL || 'https://retreat.cloverleafchristiancentre.org';
    const retreatName = context.env.RETREAT_NAME || 'Growth and Wisdom Retreat';

    // Stripe customer = the requester. They're the cardholder. Members
    // being paid FOR get a payments row but no Stripe customer record
    // tied to this session.
    const { results: requesterRows } = await context.env.DB.prepare(
      'SELECT id, name, email, stripe_customer_id FROM attendees WHERE id = ?',
    ).bind(res.requesterId).all();
    const requester = requesterRows[0] as { id: number; name: string; email: string | null; stripe_customer_id: string | null };

    let customerId = requester.stripe_customer_id;
    if (!customerId) {
      const customer = await createStripeCustomer(
        stripe,
        requester.name,
        requester.email || `${auth.ref}@noemail.retreat`,
      );
      customerId = customer.id;
      await context.env.DB.prepare(
        'UPDATE attendees SET stripe_customer_id = ? WHERE id = ?',
      ).bind(customerId, requester.id).run();
    }

    const description = `${retreatName} - ${res.groupName} (${res.members.length} ${res.members.length === 1 ? 'person' : 'people'})`;

    // Metadata carries the comma-separated attendee ids so the webhook
    // has an authoritative list to credit, in case the DB rows aren't
    // findable by session_id for some reason (e.g. an admin reran with
    // a different session). Stripe metadata values cap at 500 bytes
    // per key — even 30 ids is well under.
    const session = await createCheckoutSession(stripe, {
      customerId,
      amount: res.totalPence,
      description,
      successUrl: `${portalUrl}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${portalUrl}?payment=cancelled`,
      metadata: {
        attendee_id: String(requester.id),       // primary attendee = requester
        attendee_ref: auth.ref,
        payment_type: 'group',
        group_id: String(res.groupId),
        group_attendee_ids: res.members.map((m) => m.id).join(','),
        member_count: String(res.members.length),
      },
    });

    // Pre-record one pending payment row per member. Same
    // stripe_checkout_session_id on each so the webhook's "find by
    // session" path picks them all up.
    const stmts = res.members.map((m) =>
      context.env.DB.prepare(`
        INSERT INTO payments (
          attendee_id, stripe_checkout_session_id, stripe_customer_id,
          amount, currency, status, payment_type, description
        ) VALUES (?, ?, ?, ?, 'gbp', 'pending', 'full', ?)
      `).bind(
        m.id, session.id, customerId,
        m.payment_due_pence,
        `${retreatName} - paid by ${requester.name} (group)`,
      ),
    );
    await context.env.DB.batch(stmts);

    return createResponse({
      checkout_url: session.url,
      session_id: session.id,
      amount: res.totalPence,
      member_count: res.members.length,
      members: res.members.map((m) => ({ id: m.id, name: m.name, amount_pence: m.payment_due_pence })),
    });
  } catch (error) {
    console.error(`[${requestId}] group checkout error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
