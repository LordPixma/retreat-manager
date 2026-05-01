import type { PagesContext } from '../../../_shared/types.js';
import { createResponse, checkAdminAuth, handleCORS } from '../../../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../../_shared/errors.js';
import { penceToPounds } from '../../../_shared/stripe.js';

interface IdParams { id: string; }

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

// GET /api/admin/payments/:id
export async function onRequestGet(context: PagesContext<IdParams>): Promise<Response> {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));

    const { results } = await context.env.DB.prepare(`
      SELECT p.*, a.name as attendee_name, a.ref_number as attendee_ref
      FROM payments p LEFT JOIN attendees a ON p.attendee_id = a.id
      WHERE p.id = ?
    `).bind(context.params.id).all();

    if (results.length === 0) return createErrorResponse(errors.notFound('Payment', requestId));
    return createResponse(results[0]);
  } catch (error) {
    console.error(`[${requestId}] Error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}

// PUT /api/admin/payments/:id — confirm or reject a pending payment
export async function onRequestPut(context: PagesContext<IdParams>): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));

    const id = context.params.id;
    const body = await context.request.json() as { action: 'confirm' | 'reject' };

    if (!body.action || !['confirm', 'reject'].includes(body.action)) {
      return createErrorResponse(errors.badRequest('Action must be "confirm" or "reject"', requestId));
    }

    // Get payment
    const { results } = await context.env.DB.prepare(
      'SELECT * FROM payments WHERE id = ?'
    ).bind(id).all();

    if (results.length === 0) return createErrorResponse(errors.notFound('Payment', requestId));

    const payment = results[0] as {
      id: number; attendee_id: number; amount: number; status: string;
      payment_type: string; installment_number: number | null; installment_total: number | null;
    };

    if (payment.status !== 'pending') {
      return createErrorResponse(errors.badRequest(`Payment is already ${payment.status}`, requestId));
    }

    if (body.action === 'confirm') {
      // Mark payment as succeeded
      await context.env.DB.prepare(
        'UPDATE payments SET status = ?, paid_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).bind('succeeded', id).run();

      // Reduce attendee payment_due
      const paidPounds = penceToPounds(payment.amount);
      const { results: attendeeRows } = await context.env.DB.prepare(
        'SELECT payment_due FROM attendees WHERE id = ?'
      ).bind(payment.attendee_id).all();

      if (attendeeRows.length > 0) {
        const currentDue = (attendeeRows[0] as { payment_due: number }).payment_due || 0;
        const newDue = Math.max(0, currentDue - paidPounds);
        const newStatus = newDue <= 0 ? 'paid' : 'partial';

        await context.env.DB.prepare(
          'UPDATE attendees SET payment_due = ?, payment_status = ? WHERE id = ?'
        ).bind(newDue, newStatus, payment.attendee_id).run();
      }

      // Update installment schedule if applicable
      if (payment.payment_type === 'installment' && payment.installment_number) {
        await context.env.DB.prepare(`
          UPDATE installment_schedules
          SET installments_paid = ?,
              status = CASE WHEN ? >= installment_count THEN 'completed' ELSE 'active' END,
              next_due_date = CASE WHEN ? >= installment_count THEN NULL ELSE date(next_due_date, '+1 month') END
          WHERE attendee_id = ?
        `).bind(
          payment.installment_number, payment.installment_number,
          payment.installment_number, payment.attendee_id
        ).run();
      }

      // Send confirmation email
      context.waitUntil(sendConfirmation(context.env, payment.attendee_id, payment.amount, requestId));

      try {
        await context.env.DB.prepare(
          `INSERT INTO audit_log (admin_user, action, entity_type, entity_id, details)
           VALUES (?, 'confirm', 'payment', ?, ?)`
        ).bind(admin.user, payment.id, JSON.stringify({ amount_pence: payment.amount, attendee_id: payment.attendee_id })).run();
      } catch (err) {
        console.warn(`[${requestId}] audit_log write failed`, err);
      }

      return createResponse({ message: 'Payment confirmed successfully' });

    } else {
      // Reject — mark as failed
      await context.env.DB.prepare(
        'UPDATE payments SET status = ? WHERE id = ?'
      ).bind('failed', id).run();

      try {
        await context.env.DB.prepare(
          `INSERT INTO audit_log (admin_user, action, entity_type, entity_id, details)
           VALUES (?, 'reject', 'payment', ?, ?)`
        ).bind(admin.user, payment.id, JSON.stringify({ amount_pence: payment.amount, attendee_id: payment.attendee_id })).run();
      } catch (err) {
        console.warn(`[${requestId}] audit_log write failed`, err);
      }

      return createResponse({ message: 'Payment rejected' });
    }

  } catch (error) {
    console.error(`[${requestId}] Payment action error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}

async function sendConfirmation(env: PagesContext['env'], attendeeId: number, amountPence: number, requestId: string): Promise<void> {
  try {
    if (!env.RESEND_API_KEY || !env.FROM_EMAIL) return;
    const { results } = await env.DB.prepare('SELECT name, email FROM attendees WHERE id = ?').bind(attendeeId).all();
    if (results.length === 0) return;
    const attendee = results[0] as { name: string; email: string | null };
    if (!attendee.email) return;

    const amount = (amountPence / 100).toFixed(2);
    const retreatName = env.RETREAT_NAME || 'Growth and Wisdom Retreat';

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env.FROM_EMAIL,
        to: [attendee.email],
        subject: `Payment Confirmed - £${amount} - ${retreatName}`,
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:30px;text-align:center;border-radius:12px 12px 0 0;">
            <h1 style="color:white;margin:0;">Payment Confirmed</h1></div>
          <div style="padding:30px;background:#f8fafc;border-radius:0 0 12px 12px;">
            <p>Dear ${attendee.name},</p>
            <p>Your bank transfer payment of <strong>£${amount}</strong> has been confirmed.</p>
            <p>Thank you!</p>
            <p style="color:#6b7280;font-size:0.85rem;">— The ${retreatName} Team</p>
          </div></div>`,
      }),
    });
  } catch (err) {
    console.error(`[${requestId}] Confirmation email failed:`, err);
  }
}
