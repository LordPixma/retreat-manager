import type { PagesContext } from '../../_shared/types.js';
import { createResponse } from '../../_shared/auth.js';
import { generateRequestId } from '../../_shared/errors.js';
import { getStripe, verifyWebhookEvent, penceToPounds } from '../../_shared/stripe.js';
import { escapeHtml } from '../../_shared/sanitize.js';
import { sendEmail } from '../../_shared/email.js';
import type Stripe from 'stripe';

// CORS not needed for webhooks but Cloudflare may send OPTIONS
export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { status: 204 });
}

// POST /api/webhooks/stripe
export async function onRequestPost(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const stripe = getStripe(context.env);
    const webhookSecret = context.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error(`[${requestId}] STRIPE_WEBHOOK_SECRET not configured`);
      return new Response('Webhook secret not configured', { status: 500 });
    }

    const signature = context.request.headers.get('stripe-signature');
    if (!signature) {
      return new Response('Missing stripe-signature header', { status: 400 });
    }

    // Must use raw text body for signature verification
    const rawBody = await context.request.text();

    let event: Stripe.Event;
    try {
      event = await verifyWebhookEvent(stripe, rawBody, signature, webhookSecret);
    } catch (err) {
      console.error(`[${requestId}] Webhook signature verification failed:`, err);
      return new Response('Invalid signature', { status: 400 });
    }

    console.log(`[${requestId}] Stripe event: ${event.type} (${event.id})`);

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(context, event.data.object as Stripe.Checkout.Session, requestId);
        break;

      case 'checkout.session.expired':
        await handleCheckoutExpired(context, event.data.object as Stripe.Checkout.Session, requestId);
        break;

      default:
        console.log(`[${requestId}] Unhandled event type: ${event.type}`);
    }

    return createResponse({ received: true });

  } catch (error) {
    console.error(`[${requestId}] Webhook error:`, error);
    return new Response('Webhook handler failed', { status: 500 });
  }
}

async function handleCheckoutCompleted(
  context: PagesContext,
  session: Stripe.Checkout.Session,
  requestId: string
): Promise<void> {
  const metadata = session.metadata || {};
  const attendeeId = parseInt(metadata.attendee_id || '0');
  const paymentType = metadata.payment_type || 'full';
  const installmentNumber = parseInt(metadata.installment_number || '0') || null;
  const installmentTotal = parseInt(metadata.installment_total || '0') || null;

  if (!attendeeId) {
    console.error(`[${requestId}] No attendee_id in session metadata`);
    return;
  }

  // Only credit fully-paid sessions. Stripe can fire `checkout.session.completed`
  // for sessions that ended in `payment_status === 'unpaid'` or `'no_payment_required'`
  // (e.g. async bank-redirect that later fails). Without this guard a manipulated
  // session-metadata pair could zero out an attendee's balance for free.
  if (session.payment_status !== 'paid') {
    console.warn(`[${requestId}] Ignoring session ${session.id} with payment_status=${session.payment_status}`);
    return;
  }

  // Confirm the session/PI was created against our attendee — defends against
  // a tampered metadata.attendee_id by re-deriving from the checkout session
  // we previously inserted into the payments table.
  const { results: ownership } = await context.env.DB.prepare(
    'SELECT attendee_id FROM payments WHERE stripe_checkout_session_id = ?'
  ).bind(session.id).all();
  if (ownership.length > 0 && (ownership[0] as { attendee_id: number }).attendee_id !== attendeeId) {
    console.error(`[${requestId}] attendee_id metadata ${attendeeId} does not match session ${session.id} owner; refusing to credit`);
    return;
  }

  const amountTotal = session.amount_total || 0;
  const paymentIntentId = typeof session.payment_intent === 'string'
    ? session.payment_intent
    : session.payment_intent?.id || null;

  // Check idempotency — skip if payment already recorded
  if (paymentIntentId) {
    const { results: existing } = await context.env.DB.prepare(
      'SELECT id FROM payments WHERE stripe_payment_intent_id = ? AND status = ?'
    ).bind(paymentIntentId, 'succeeded').all();

    if (existing.length > 0) {
      console.log(`[${requestId}] Payment already recorded for PI ${paymentIntentId}, skipping`);
      return;
    }
  }

  // Update payment record (find by checkout session ID)
  await context.env.DB.prepare(`
    UPDATE payments
    SET status = 'succeeded',
        stripe_payment_intent_id = ?,
        paid_at = CURRENT_TIMESTAMP
    WHERE stripe_checkout_session_id = ? AND attendee_id = ?
  `).bind(paymentIntentId, session.id, attendeeId).run();

  // Reduce attendee's payment_due
  const paidPounds = penceToPounds(amountTotal);
  const { results: attendeeRows } = await context.env.DB.prepare(
    'SELECT payment_due FROM attendees WHERE id = ?'
  ).bind(attendeeId).all();

  if (attendeeRows.length > 0) {
    const currentDue = (attendeeRows[0] as { payment_due: number }).payment_due || 0;
    const newDue = Math.max(0, currentDue - paidPounds);
    const newStatus = newDue <= 0 ? 'paid' : 'partial';

    await context.env.DB.prepare(`
      UPDATE attendees SET payment_due = ?, payment_status = ? WHERE id = ?
    `).bind(newDue, newStatus, attendeeId).run();

    console.log(`[${requestId}] Attendee ${attendeeId}: payment_due ${currentDue} -> ${newDue}, status -> ${newStatus}`);
  }

  // Update installment schedule if applicable
  if (paymentType === 'installment' && installmentNumber) {
    await context.env.DB.prepare(`
      UPDATE installment_schedules
      SET installments_paid = ?,
          status = CASE WHEN ? >= installment_count THEN 'completed' ELSE 'active' END,
          next_due_date = CASE
            WHEN ? >= installment_count THEN NULL
            ELSE date(next_due_date, '+1 month')
          END
      WHERE attendee_id = ?
    `).bind(installmentNumber, installmentNumber, installmentNumber, attendeeId).run();

    console.log(`[${requestId}] Installment ${installmentNumber}/${installmentTotal} recorded for attendee ${attendeeId}`);
  }

  // Send confirmation email
  context.waitUntil(sendPaymentConfirmationEmail(context.env, attendeeId, amountTotal, paymentType, requestId));
}

async function handleCheckoutExpired(
  context: PagesContext,
  session: Stripe.Checkout.Session,
  requestId: string
): Promise<void> {
  await context.env.DB.prepare(`
    UPDATE payments SET status = 'cancelled' WHERE stripe_checkout_session_id = ? AND status = 'pending'
  `).bind(session.id).run();

  console.log(`[${requestId}] Checkout session ${session.id} expired, payment cancelled`);
}

async function sendPaymentConfirmationEmail(
  env: PagesContext['env'],
  attendeeId: number,
  amountPence: number,
  paymentType: string,
  requestId: string
): Promise<void> {
  try {
    const { results } = await env.DB.prepare(
      'SELECT name, email FROM attendees WHERE id = ?'
    ).bind(attendeeId).all();

    if (results.length === 0 || !(results[0] as { email: string | null }).email) return;

    const attendee = results[0] as { name: string; email: string };
    const amount = (amountPence / 100).toFixed(2);
    const retreatName = env.RETREAT_NAME || 'Growth and Wisdom Retreat';

    const ok = await sendEmail(env, {
      to: attendee.email,
      subject: `Payment Confirmation - £${amount} - ${retreatName}`,
      html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0;">Payment Confirmed</h1>
            </div>
            <div style="padding: 30px; background: #f8fafc; border-radius: 0 0 12px 12px;">
              <p>Dear ${escapeHtml(attendee.name)},</p>
              <p>We have received your payment of <strong>£${amount}</strong> for the ${escapeHtml(retreatName)}.</p>
              <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0;">
                <p style="margin: 0;"><strong>Amount Paid:</strong> £${amount}</p>
                <p style="margin: 5px 0 0;"><strong>Payment Type:</strong> ${paymentType === 'installment' ? 'Installment Payment' : 'Full Payment'}</p>
              </div>
              ${paymentType === 'installment' ? '<p>Your remaining installments will be due according to your payment schedule. You will receive a reminder before each payment is due.</p>' : ''}
              <p>Thank you for your payment!</p>
              <p style="color: #6b7280; font-size: 0.85rem;">— The ${escapeHtml(retreatName)} Team</p>
            </div>
          </div>
        `,
    });

    if (ok) console.log(`[${requestId}] Payment confirmation email sent to ${attendee.email}`);
  } catch (error) {
    console.error(`[${requestId}] Failed to send payment confirmation email:`, error);
  }
}
