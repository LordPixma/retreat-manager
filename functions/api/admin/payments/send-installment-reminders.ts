import type { PagesContext } from '../../../_shared/types.js';
import { createResponse, checkAdminAuth, handleCORS } from '../../../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../../_shared/errors.js';
import { getStripe, createCheckoutSession } from '../../../_shared/stripe.js';
import { escapeHtml } from '../../../_shared/sanitize.js';

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
    let sent = 0;
    const results: { attendee: string; status: string; error?: string }[] = [];

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

        // Create checkout session for next installment
        const session = await createCheckoutSession(stripe, {
          customerId,
          amount: schedule.installment_amount,
          description: `${retreatName} - Installment ${nextInstallment} of ${schedule.installment_count}`,
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

        // Record pending payment
        await context.env.DB.prepare(`
          INSERT INTO payments (attendee_id, stripe_checkout_session_id, stripe_customer_id, amount, currency, status, payment_type, installment_number, installment_total, description)
          VALUES (?, ?, ?, ?, 'gbp', 'pending', 'installment', ?, ?, ?)
        `).bind(
          schedule.attendee_id,
          session.id,
          customerId,
          schedule.installment_amount,
          nextInstallment,
          schedule.installment_count,
          `${retreatName} - Installment ${nextInstallment} of ${schedule.installment_count}`
        ).run();

        // Send reminder email with payment link
        if (context.env.RESEND_API_KEY && context.env.FROM_EMAIL) {
          const amount = (schedule.installment_amount / 100).toFixed(2);
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${context.env.RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: context.env.FROM_EMAIL,
              to: [schedule.email],
              subject: `Installment Payment Due - £${amount} - ${retreatName}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
                    <h1 style="color: white; margin: 0;">Installment Payment Due</h1>
                  </div>
                  <div style="padding: 30px; background: #f8fafc; border-radius: 0 0 12px 12px;">
                    <p>Dear ${escapeHtml(schedule.name)},</p>
                    <p>Your installment payment for the ${escapeHtml(retreatName)} is now due.</p>
                    <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
                      <p style="margin: 0;"><strong>Amount Due:</strong> £${amount}</p>
                      <p style="margin: 5px 0 0;"><strong>Installment:</strong> ${nextInstallment} of ${schedule.installment_count}</p>
                    </div>
                    <div style="text-align: center; margin: 25px 0;">
                      <a href="${session.url}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Pay Now - £${amount}</a>
                    </div>
                    <p style="color: #6b7280; font-size: 0.85rem;">This link will expire in 24 hours. If you have any questions, please contact the retreat organizers.</p>
                  </div>
                </div>
              `,
            }),
          });
        }

        sent++;
        results.push({ attendee: schedule.name, status: 'sent' });
      } catch (error) {
        console.error(`[${requestId}] Failed to process installment for ${schedule.name}:`, error);
        results.push({ attendee: schedule.name, status: 'error', error: String(error) });
      }
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
