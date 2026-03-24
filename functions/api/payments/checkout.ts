import type { PagesContext } from '../../_shared/types.js';
import { createResponse, checkAttendeeAuth, handleCORS } from '../../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../_shared/errors.js';
import { getStripe, createStripeCustomer, createCheckoutSession, poundsToPence } from '../../_shared/stripe.js';

interface AttendeeRow {
  id: number;
  ref_number: string;
  name: string;
  email: string | null;
  payment_due: number;
  payment_option: string | null;
  stripe_customer_id: string | null;
}

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

// POST /api/payments/checkout
export async function onRequestPost(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const auth = await checkAttendeeAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!auth) {
      return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));
    }

    const body = await context.request.json() as {
      payment_type: 'full' | 'installment';
      installment_count?: 3 | 4;
    };

    if (!body.payment_type || !['full', 'installment'].includes(body.payment_type)) {
      return createErrorResponse(errors.badRequest('Invalid payment_type. Must be "full" or "installment"', requestId));
    }

    if (body.payment_type === 'installment') {
      if (!body.installment_count || ![3, 4].includes(body.installment_count)) {
        return createErrorResponse(errors.badRequest('installment_count must be 3 or 4', requestId));
      }
    }

    // Get attendee
    const { results } = await context.env.DB.prepare(`
      SELECT id, ref_number, name, email, payment_due, payment_option, stripe_customer_id
      FROM attendees WHERE ref_number = ?
    `).bind(auth.ref).all();

    if (results.length === 0) {
      return createErrorResponse(errors.notFound('Attendee', requestId));
    }

    const attendee = results[0] as unknown as AttendeeRow;

    if (attendee.payment_due <= 0) {
      return createErrorResponse(errors.badRequest('No payment due', requestId));
    }

    const stripe = getStripe(context.env);
    const portalUrl = context.env.PORTAL_URL || 'https://retreat.cloverleafchristiancentre.org';
    const retreatName = context.env.RETREAT_NAME || 'Growth and Wisdom Retreat';

    // Create or reuse Stripe customer
    let customerId = attendee.stripe_customer_id;
    if (!customerId) {
      const customer = await createStripeCustomer(
        stripe,
        attendee.name,
        attendee.email || `${attendee.ref_number}@noemail.retreat`
      );
      customerId = customer.id;

      await context.env.DB.prepare(
        'UPDATE attendees SET stripe_customer_id = ? WHERE id = ?'
      ).bind(customerId, attendee.id).run();
    }

    let amount: number;
    let description: string;
    let installmentNumber: number | null = null;
    let installmentTotal: number | null = null;

    if (body.payment_type === 'full') {
      amount = poundsToPence(attendee.payment_due);
      description = `${retreatName} - Full Payment`;
    } else {
      const count = body.installment_count!;
      installmentTotal = count;

      // Check for existing installment schedule
      const { results: scheduleRows } = await context.env.DB.prepare(
        'SELECT * FROM installment_schedules WHERE attendee_id = ? AND status = ?'
      ).bind(attendee.id, 'active').all();

      if (scheduleRows.length > 0) {
        // Continue existing schedule
        const schedule = scheduleRows[0] as { installments_paid: number; installment_amount: number; installment_count: number };
        installmentNumber = schedule.installments_paid + 1;
        installmentTotal = schedule.installment_count;
        amount = schedule.installment_amount;
      } else {
        // Create new installment schedule
        const totalPence = poundsToPence(attendee.payment_due);
        const perInstallment = Math.ceil(totalPence / count);
        installmentNumber = 1;

        const nextDue = new Date();
        nextDue.setMonth(nextDue.getMonth() + 1);
        const nextDueStr = nextDue.toISOString().split('T')[0];

        await context.env.DB.prepare(`
          INSERT INTO installment_schedules (attendee_id, total_amount, installment_count, installment_amount, installments_paid, status, next_due_date, stripe_customer_id)
          VALUES (?, ?, ?, ?, 0, 'active', ?, ?)
        `).bind(attendee.id, totalPence, count, perInstallment, nextDueStr, customerId).run();

        amount = perInstallment;
      }

      description = `${retreatName} - Installment ${installmentNumber} of ${installmentTotal}`;
    }

    // Create Checkout Session
    const session = await createCheckoutSession(stripe, {
      customerId,
      amount,
      description,
      successUrl: `${portalUrl}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${portalUrl}?payment=cancelled`,
      metadata: {
        attendee_id: String(attendee.id),
        attendee_ref: attendee.ref_number,
        payment_type: body.payment_type,
        installment_number: String(installmentNumber || ''),
        installment_total: String(installmentTotal || ''),
      },
    });

    // Record pending payment
    await context.env.DB.prepare(`
      INSERT INTO payments (attendee_id, stripe_checkout_session_id, stripe_customer_id, amount, currency, status, payment_type, installment_number, installment_total, description)
      VALUES (?, ?, ?, ?, 'gbp', 'pending', ?, ?, ?, ?)
    `).bind(
      attendee.id,
      session.id,
      customerId,
      amount,
      body.payment_type,
      installmentNumber,
      installmentTotal,
      description
    ).run();

    return createResponse({
      checkout_url: session.url,
      session_id: session.id,
      amount,
      description,
    });

  } catch (error) {
    console.error(`[${requestId}] Checkout error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
