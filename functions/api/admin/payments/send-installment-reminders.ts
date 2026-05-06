import type { PagesContext } from '../../../_shared/types.js';
import { createResponse, checkAdminAuth, handleCORS } from '../../../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../../_shared/errors.js';
import { getStripe, createCheckoutSession } from '../../../_shared/stripe.js';
import { escapeHtml } from '../../../_shared/sanitize.js';
import { sendEmailsBulk, type OutboundEmail } from '../../../_shared/email.js';

interface ScheduleRow {
  id: number;
  attendee_id: number;
  total_amount: number;
  installment_count: number;
  installment_amount: number;
  installments_paid: number;
  next_due_date: string;
  stripe_customer_id: string | null;
}

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

// POST /api/admin/payments/send-installment-reminders
export async function onRequestPost(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));
    }

    const today = new Date().toISOString().split('T')[0];
    const portalUrl = context.env.PORTAL_URL || 'https://retreat.cloverleafchristiancentre.org';
    const retreatName = context.env.RETREAT_NAME || 'Growth and Wisdom Retreat';

    // Find active installment schedules that are due
    const { results: schedules } = await context.env.DB.prepare(`
      SELECT s.*, a.name, a.email, a.ref_number, a.stripe_customer_id as attendee_stripe_id
      FROM installment_schedules s
      JOIN attendees a ON s.attendee_id = a.id
      WHERE s.status = 'active'
        AND s.installments_paid < s.installment_count
        AND s.next_due_date <= ?
    `).bind(today).all();

    if (schedules.length === 0) {
      return createResponse({ message: 'No installment reminders due', sent: 0 });
    }

    const stripe = getStripe(context.env);
    const results: { attendee: string; status: string; error?: string }[] = [];

    // Phase 1: per-schedule Stripe session creation. Stripe doesn't support
    // batch session creation so this is sequential. Each successful session
    // produces a (paymentInsertBindings, emailPayload) pair queued for the
    // batched DB and email phases below.
    interface PreparedSend {
      attendeeId: number;
      attendeeName: string;
      email: string;
      sessionId: string;
      sessionUrl: string;
      installmentAmountPence: number;
      installmentNumber: number;
      installmentTotal: number;
      stripeCustomerId: string;
      description: string;
    }
    const prepared: PreparedSend[] = [];

    for (const row of schedules) {
      const schedule = row as unknown as ScheduleRow & { name: string; email: string | null; ref_number: string; attendee_stripe_id: string | null };

      try {
        if (!schedule.email) {
          results.push({ attendee: schedule.name, status: 'skipped', error: 'No email' });
          continue;
        }
        const customerId = schedule.stripe_customer_id || schedule.attendee_stripe_id;
        if (!customerId) {
          results.push({ attendee: schedule.name, status: 'skipped', error: 'No Stripe customer' });
          continue;
        }

        const nextInstallment = schedule.installments_paid + 1;
        const description = `${retreatName} - Installment ${nextInstallment} of ${schedule.installment_count}`;

        const session = await createCheckoutSession(stripe, {
          customerId,
          amount: schedule.installment_amount,
          description,
          successUrl: `${portalUrl}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${portalUrl}?payment=cancelled`,
          metadata: {
            attendee_id: String(schedule.attendee_id),
            attendee_ref: schedule.ref_number,
            payment_type: 'installment',
            installment_number: String(nextInstallment),
            installment_total: String(schedule.installment_count),
          },
        });

        prepared.push({
          attendeeId: schedule.attendee_id,
          attendeeName: schedule.name,
          email: schedule.email,
          sessionId: session.id,
          sessionUrl: session.url || `${portalUrl}?payment=cancelled`,
          installmentAmountPence: schedule.installment_amount,
          installmentNumber: nextInstallment,
          installmentTotal: schedule.installment_count,
          stripeCustomerId: customerId,
          description,
        });
      } catch (error) {
        console.error(`[${requestId}] Stripe session for ${schedule.name} failed:`, error);
        results.push({ attendee: schedule.name, status: 'error', error: String(error) });
      }
    }

    if (prepared.length === 0) {
      return createResponse({ message: 'No installment reminders sent', sent: 0, total: schedules.length, results });
    }

    // Phase 2: insert all pending-payment rows in a single D1 batch (one
    // subrequest for the lot, regardless of count).
    try {
      const insertStmt = context.env.DB.prepare(`
        INSERT INTO payments (attendee_id, stripe_checkout_session_id, stripe_customer_id, amount, currency, status, payment_type, installment_number, installment_total, description)
        VALUES (?, ?, ?, ?, 'gbp', 'pending', 'installment', ?, ?, ?)
      `);
      const inserts = prepared.map(p => insertStmt.bind(
        p.attendeeId,
        p.sessionId,
        p.stripeCustomerId,
        p.installmentAmountPence,
        p.installmentNumber,
        p.installmentTotal,
        p.description,
      ));
      await context.env.DB.batch(inserts);
    } catch (err) {
      console.error(`[${requestId}] Payments insert batch failed`, err);
      // Don't abort — we still want to email out, the admin can reconcile.
    }

    // Phase 3: fan out reminder emails through the Cloudflare Email Send
    // binding. sendEmailsBulk caps concurrency so even a large schedule list
    // stays under the per-request subrequest budget.
    let sent = 0;
    if (context.env.EMAIL && context.env.FROM_EMAIL) {
      const messages: OutboundEmail[] = prepared.map(p => {
        const amount = (p.installmentAmountPence / 100).toFixed(2);
        return {
          to: p.email,
          subject: `Installment Payment Due - £${amount} - ${retreatName}`,
          html: buildInstallmentHtml(p, retreatName, amount),
        };
      });
      const keys = prepared.map((_, idx) => idx);

      const bulkResult = await sendEmailsBulk(context.env, messages, keys);
      sent = bulkResult.sentKeys.length;
      for (const idx of bulkResult.sentKeys) {
        results.push({ attendee: prepared[idx].attendeeName, status: 'sent' });
      }
      for (const idx of bulkResult.failedKeys) {
        const err = bulkResult.errorsByKey?.[String(idx)] || bulkResult.errorMessage || 'Unknown error';
        results.push({ attendee: prepared[idx].attendeeName, status: 'error', error: err });
      }
    } else {
      for (const p of prepared) results.push({ attendee: p.attendeeName, status: 'skipped', error: 'Email service not configured' });
    }

    return createResponse({
      message: `Sent ${sent} installment reminders`,
      sent,
      total: schedules.length,
      results,
    });

  } catch (error) {
    console.error(`[${requestId}] Installment reminder error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}

function buildInstallmentHtml(
  p: { attendeeName: string; sessionUrl: string; installmentNumber: number; installmentTotal: number },
  retreatName: string,
  amount: string,
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0;">Installment Payment Due</h1>
      </div>
      <div style="padding: 30px; background: #f8fafc; border-radius: 0 0 12px 12px;">
        <p>Dear ${escapeHtml(p.attendeeName)},</p>
        <p>Your installment payment for the ${escapeHtml(retreatName)} is now due.</p>
        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
          <p style="margin: 0;"><strong>Amount Due:</strong> £${amount}</p>
          <p style="margin: 5px 0 0;"><strong>Installment:</strong> ${p.installmentNumber} of ${p.installmentTotal}</p>
        </div>
        <div style="text-align: center; margin: 25px 0;">
          <a href="${escapeHtml(p.sessionUrl)}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Pay Now - £${amount}</a>
        </div>
        <p style="color: #6b7280; font-size: 0.85rem;">This link will expire in 24 hours. If you have any questions, please contact the retreat organizers.</p>
      </div>
    </div>
  `;
}
