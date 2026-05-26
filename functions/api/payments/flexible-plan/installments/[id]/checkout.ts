// POST /api/payments/flexible-plan/installments/:id/checkout
//
// Creates a Stripe Checkout session for a single installment row.
// Returns the checkout URL the attendee dashboard redirects them to.
//
// We do NOT pre-record a row in the legacy `payments` table — the
// flexible-installment row IS the payment record (Stripe session id +
// payment intent id are stored on it). The Stripe webhook (extended for
// payment_type='flexible_installment') is what marks it paid.

import type { PagesContext } from '../../../../../_shared/types.js';
import { createResponse, checkAttendeeAuth, handleCORS } from '../../../../../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../../../../_shared/errors.js';
import { getStripe, createStripeCustomer, createCheckoutSession } from '../../../../../_shared/stripe.js';
import type { FlexibleInstallmentRow, FlexiblePlanRow } from '../../../../../_shared/flexible-plans.js';

interface AttendeeRow {
  id: number;
  ref_number: string;
  name: string;
  email: string | null;
  stripe_customer_id: string | null;
}

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

export async function onRequestPost(context: PagesContext<{ id: string }>): Promise<Response> {
  const requestId = generateRequestId();
  try {
    const auth = await checkAttendeeAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!auth) return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));

    const installmentId = Number(context.params.id);
    if (!Number.isInteger(installmentId) || installmentId <= 0) {
      return createErrorResponse(errors.badRequest('Invalid installment id', requestId));
    }

    // Resolve attendee from token first so we can authorise ownership.
    const aRes = await context.env.DB.prepare(
      'SELECT id, ref_number, name, email, stripe_customer_id FROM attendees WHERE ref_number = ?',
    ).bind(auth.ref).all();
    if (!aRes.results.length) return createErrorResponse(errors.notFound('Attendee', requestId));
    const attendee = aRes.results[0] as unknown as AttendeeRow;

    // Join installment + plan to verify (a) the installment exists, (b) it
    // belongs to this attendee's plan, and (c) it's actually still payable.
    const iRes = await context.env.DB.prepare(`
      SELECT i.*, p.attendee_id AS plan_attendee_id, p.status AS plan_status
      FROM flexible_installments i
      JOIN flexible_payment_plans p ON p.id = i.plan_id
      WHERE i.id = ?
    `).bind(installmentId).all();
    if (!iRes.results.length) return createErrorResponse(errors.notFound('Installment', requestId));
    const row = iRes.results[0] as unknown as FlexibleInstallmentRow & { plan_attendee_id: number; plan_status: FlexiblePlanRow['status'] };

    if (row.plan_attendee_id !== attendee.id) {
      // Don't leak whether the id exists for a different attendee.
      return createErrorResponse(errors.notFound('Installment', requestId));
    }
    if (row.plan_status !== 'active') {
      return createErrorResponse(errors.badRequest('Plan is not active', requestId));
    }
    if (row.status === 'paid') {
      return createErrorResponse(errors.badRequest('Installment is already paid', requestId));
    }
    if (row.status === 'cancelled') {
      return createErrorResponse(errors.badRequest('Installment was cancelled', requestId));
    }

    const stripe = getStripe(context.env);
    const portalUrl = context.env.PORTAL_URL || 'https://retreat.cloverleafchristiancentre.org';
    const retreatName = context.env.RETREAT_NAME || 'Growth and Wisdom Retreat';

    let customerId = attendee.stripe_customer_id;
    if (!customerId) {
      const customer = await createStripeCustomer(
        stripe,
        attendee.name,
        attendee.email || `${attendee.ref_number}@noemail.retreat`,
      );
      customerId = customer.id;
      await context.env.DB.prepare(
        'UPDATE attendees SET stripe_customer_id = ? WHERE id = ?',
      ).bind(customerId, attendee.id).run();
    }

    const description = `${retreatName} - Plan Installment ${row.installment_number}`;

    const session = await createCheckoutSession(stripe, {
      customerId,
      amount: row.amount,
      description,
      successUrl: `${portalUrl}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${portalUrl}?payment=cancelled`,
      metadata: {
        // Webhook keys off these to reconcile back to our row.
        attendee_id: String(attendee.id),
        attendee_ref: attendee.ref_number,
        payment_type: 'flexible_installment',
        flexible_plan_id: String(row.plan_id),
        flexible_installment_id: String(row.id),
        installment_number: String(row.installment_number),
      },
    });

    // Store the session id NOW so the webhook can find the row even if the
    // attendee never returns to the success_url (e.g. closes the tab).
    // If they create a new session later, we overwrite — only one open
    // session per row is meaningful and Stripe will expire stale ones.
    await context.env.DB.prepare(`
      UPDATE flexible_installments
      SET stripe_checkout_session_id = ?, payment_method = 'card'
      WHERE id = ?
    `).bind(session.id, row.id).run();

    return createResponse({
      checkout_url: session.url,
      session_id: session.id,
      amount: row.amount,
    });
  } catch (error) {
    console.error(`[${requestId}] flex installment checkout error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
