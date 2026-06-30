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

  // Flexible-plan installments live in their own table — handle them
  // separately so the legacy installment_schedules update below doesn't
  // run, then return. We still credit attendee.payment_due so the
  // outstanding-balance UI stays in sync.
  if (paymentType === 'flexible_installment') {
    await handleFlexibleInstallmentCompleted(context, session, attendeeId, requestId);
    return;
  }

  // Group/family payment — one Stripe session covers many attendees.
  // Each attendee has their own pending payments row sharing this
  // session id. Mark all paid + credit each balance individually.
  if (paymentType === 'group') {
    await handleGroupCheckoutCompleted(context, session, requestId);
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

  // Flip the payment row to succeeded. The `status = 'pending'` guard makes
  // this the authoritative idempotency point: only the invocation that
  // actually transitions pending -> succeeded credits the balance below, so a
  // duplicate or concurrent webhook delivery can't reduce payment_due twice
  // (the PI check above only catches sequential re-delivery, not a race).
  const upd = await context.env.DB.prepare(`
    UPDATE payments
    SET status = 'succeeded',
        stripe_payment_intent_id = ?,
        paid_at = CURRENT_TIMESTAMP
    WHERE stripe_checkout_session_id = ? AND attendee_id = ? AND status = 'pending'
  `).bind(paymentIntentId, session.id, attendeeId).run();

  if (upd.meta.changes === 0) {
    console.log(`[${requestId}] payment for session ${session.id} / attendee ${attendeeId} already finalised, skipping credit`);
    return;
  }

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

async function handleGroupCheckoutCompleted(
  context: PagesContext,
  session: Stripe.Checkout.Session,
  requestId: string,
): Promise<void> {
  // All pending payments rows sharing this session were inserted
  // together by /api/payments/group/checkout — one per family member.
  // Trust the rows as the authoritative recipient list; metadata
  // group_attendee_ids is informational only.
  const { results: rows } = await context.env.DB.prepare(`
    SELECT id, attendee_id, amount, status
    FROM payments
    WHERE stripe_checkout_session_id = ?
  `).bind(session.id).all();

  if (!rows.length) {
    console.error(`[${requestId}] group session ${session.id} has no pending payment rows`);
    return;
  }

  // Idempotency: if any row is already succeeded, the webhook fired
  // twice. Bail to avoid double-crediting balances.
  const alreadyDone = rows.some((r) => (r as { status: string }).status === 'succeeded');
  if (alreadyDone) {
    console.log(`[${requestId}] group session ${session.id} already credited, skipping`);
    return;
  }

  const paymentIntentId = typeof session.payment_intent === 'string'
    ? session.payment_intent
    : session.payment_intent?.id || null;

  // Mark every family row succeeded. We deliberately do NOT write the PI in
  // this multi-row UPDATE: payments.stripe_payment_intent_id is UNIQUE, and a
  // group session has one row per member, so setting the same PI on all of
  // them trips the UNIQUE constraint — which previously threw HERE, before any
  // balance was credited, leaving the whole family charged-but-not-credited
  // and the webhook stuck in a 500 retry loop. A single row is tagged with the
  // PI afterwards for traceability. The rows-changed check below also keeps
  // crediting idempotent against duplicate/concurrent deliveries.
  const upd = await context.env.DB.prepare(`
    UPDATE payments
    SET status = 'succeeded', paid_at = CURRENT_TIMESTAMP
    WHERE stripe_checkout_session_id = ? AND status = 'pending'
  `).bind(session.id).run();

  if (upd.meta.changes === 0) {
    console.log(`[${requestId}] group session ${session.id} already credited, skipping`);
    return;
  }

  // Tag exactly one row with the PI for receipt traceability (UNIQUE-safe).
  if (paymentIntentId) {
    await context.env.DB.prepare(`
      UPDATE payments
      SET stripe_payment_intent_id = ?
      WHERE id = (SELECT MIN(id) FROM payments WHERE stripe_checkout_session_id = ?)
    `).bind(paymentIntentId, session.id).run();
  }

  // Credit each attendee's balance. We iterate rather than batch a
  // single SQL because each attendee has a distinct payment_due
  // figure to reduce. Batch the UPDATEs across one D1 batch() call
  // so it's one round-trip regardless of family size.
  const creditStmts: D1PreparedStatement[] = [];
  for (const r of rows as Array<{ attendee_id: number; amount: number }>) {
    const paidPounds = penceToPounds(r.amount);
    // SQLite arithmetic in the UPDATE so we don't have to read-modify-
    // write per attendee — `payment_due = MAX(payment_due - X, 0)`.
    creditStmts.push(
      context.env.DB.prepare(`
        UPDATE attendees
        SET payment_due = MAX(COALESCE(payment_due, 0) - ?, 0),
            payment_status = CASE
              WHEN COALESCE(payment_due, 0) - ? <= 0 THEN 'paid'
              ELSE 'partial'
            END
        WHERE id = ?
      `).bind(paidPounds, paidPounds, r.attendee_id),
    );
  }
  await context.env.DB.batch(creditStmts);

  console.log(`[${requestId}] group session ${session.id}: credited ${rows.length} attendees`);

  // Confirmation email goes to the PAYER (session metadata.attendee_id)
  // listing who was paid for. Best-effort.
  const payerId = parseInt(session.metadata?.attendee_id || '0');
  if (payerId) {
    context.waitUntil(sendGroupConfirmationEmail(
      context.env,
      payerId,
      rows as Array<{ attendee_id: number; amount: number }>,
      session.amount_total || 0,
      requestId,
    ));
  }
}

async function sendGroupConfirmationEmail(
  env: PagesContext['env'],
  payerId: number,
  rows: Array<{ attendee_id: number; amount: number }>,
  totalPence: number,
  requestId: string,
): Promise<void> {
  try {
    const { results: payerRows } = await env.DB.prepare(
      'SELECT name, email FROM attendees WHERE id = ?',
    ).bind(payerId).all();
    if (!payerRows.length || !(payerRows[0] as { email: string | null }).email) return;
    const payer = payerRows[0] as { name: string; email: string };

    const ids = rows.map((r) => r.attendee_id);
    const placeholders = ids.map(() => '?').join(',');
    const { results: nameRows } = await env.DB.prepare(
      `SELECT id, name FROM attendees WHERE id IN (${placeholders})`,
    ).bind(...ids).all();
    const nameById = new Map<number, string>();
    for (const r of nameRows as Array<{ id: number; name: string }>) nameById.set(r.id, r.name);

    const retreatName = env.RETREAT_NAME || 'Growth and Wisdom Retreat';
    const itemsHtml = rows.map((r) => {
      const name = nameById.get(r.attendee_id) || `Attendee #${r.attendee_id}`;
      return `<tr><td style="padding:6px;border-bottom:1px solid #eee">${escapeHtml(name)}</td><td style="padding:6px;border-bottom:1px solid #eee;text-align:right">£${(r.amount / 100).toFixed(2)}</td></tr>`;
    }).join('');

    await sendEmail(env, {
      to: payer.email,
      subject: `Family Payment Confirmation - £${(totalPence / 100).toFixed(2)} - ${retreatName}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#222">
        <h2 style="color:#667eea">Family Payment Confirmed</h2>
        <p>Dear ${escapeHtml(payer.name)},</p>
        <p>Thank you — we've received your family payment of <strong>£${(totalPence / 100).toFixed(2)}</strong> for ${escapeHtml(retreatName)}.</p>
        <p>Paid for:</p>
        <table style="width:100%;border-collapse:collapse;margin:12px 0">
          <thead><tr><th style="padding:6px;text-align:left;background:#f6f6fb">Member</th><th style="padding:6px;text-align:right;background:#f6f6fb">Amount</th></tr></thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <p style="color:#6b7280;font-size:0.85rem">— The ${escapeHtml(retreatName)} Team</p>
      </div>`,
    });
  } catch (err) {
    console.error(`[${requestId}] group confirmation email failed:`, err);
  }
}

async function handleFlexibleInstallmentCompleted(
  context: PagesContext,
  session: Stripe.Checkout.Session,
  attendeeId: number,
  requestId: string,
): Promise<void> {
  const metadata = session.metadata || {};
  const installmentId = parseInt(metadata.flexible_installment_id || '0');
  const planId = parseInt(metadata.flexible_plan_id || '0');
  if (!installmentId || !planId) {
    console.error(`[${requestId}] Missing flexible_installment_id/plan_id metadata on session ${session.id}`);
    return;
  }

  // Ownership check: re-derive attendee from the plan rather than trusting
  // metadata blindly. Mirrors the legacy-path guard above.
  const ownerRes = await context.env.DB.prepare(
    `SELECT p.attendee_id, i.status AS installment_status, i.amount AS installment_amount
     FROM flexible_installments i
     JOIN flexible_payment_plans p ON p.id = i.plan_id
     WHERE i.id = ? AND i.plan_id = ?`,
  ).bind(installmentId, planId).all();
  if (!ownerRes.results.length) {
    console.error(`[${requestId}] flexible_installment ${installmentId} / plan ${planId} not found`);
    return;
  }
  const owner = ownerRes.results[0] as { attendee_id: number; installment_status: string; installment_amount: number };
  if (owner.attendee_id !== attendeeId) {
    console.error(`[${requestId}] metadata attendee ${attendeeId} doesn't own installment ${installmentId}; refusing`);
    return;
  }
  if (owner.installment_status === 'paid') {
    console.log(`[${requestId}] flexible_installment ${installmentId} already paid, skipping`);
    return;
  }

  const paymentIntentId = typeof session.payment_intent === 'string'
    ? session.payment_intent
    : session.payment_intent?.id || null;

  // Mark the installment row paid.
  await context.env.DB.prepare(`
    UPDATE flexible_installments
    SET status = 'paid',
        payment_method = 'card',
        stripe_payment_intent_id = ?,
        paid_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(paymentIntentId, installmentId).run();

  // Credit the attendee's outstanding balance.
  const paidPounds = penceToPounds(session.amount_total || owner.installment_amount);
  const { results: aRows } = await context.env.DB.prepare(
    'SELECT payment_due FROM attendees WHERE id = ?',
  ).bind(attendeeId).all();
  if (aRows.length) {
    const currentDue = (aRows[0] as { payment_due: number }).payment_due || 0;
    const newDue = Math.max(0, currentDue - paidPounds);
    const newStatus = newDue <= 0 ? 'paid' : 'partial';
    await context.env.DB.prepare(
      `UPDATE attendees SET payment_due = ?, payment_status = ? WHERE id = ?`,
    ).bind(newDue, newStatus, attendeeId).run();
    console.log(`[${requestId}] flex plan: attendee ${attendeeId} payment_due ${currentDue} -> ${newDue}`);
  }

  // If every installment on this plan is now paid (or cancelled), the
  // plan itself is complete.
  const { results: openRows } = await context.env.DB.prepare(
    `SELECT COUNT(*) AS open_count FROM flexible_installments
     WHERE plan_id = ? AND status IN ('upcoming', 'pending_bank', 'overdue')`,
  ).bind(planId).all();
  const openCount = (openRows[0] as { open_count: number }).open_count;
  if (openCount === 0) {
    await context.env.DB.prepare(
      `UPDATE flexible_payment_plans SET status = 'completed' WHERE id = ?`,
    ).bind(planId).run();
    console.log(`[${requestId}] flexible plan ${planId} fully paid → completed`);
  }

  // Confirmation email (best-effort, async).
  context.waitUntil(
    sendPaymentConfirmationEmail(context.env, attendeeId, session.amount_total || owner.installment_amount, 'flexible_installment', requestId),
  );
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
                <p style="margin: 5px 0 0;"><strong>Payment Type:</strong> ${paymentType === 'installment' || paymentType === 'flexible_installment' ? 'Installment Payment' : 'Full Payment'}</p>
              </div>
              ${paymentType === 'installment' || paymentType === 'flexible_installment' ? '<p>Your remaining installments will be due according to your payment schedule. You will receive a reminder before each payment is due.</p>' : ''}
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
