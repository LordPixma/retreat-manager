import type { PagesContext } from '../../_shared/types.js';
import { createResponse, checkAttendeeAuth, handleCORS } from '../../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../_shared/errors.js';

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

// GET /api/payments/status
export async function onRequestGet(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const auth = await checkAttendeeAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!auth) {
      return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));
    }

    const { results } = await context.env.DB.prepare(`
      SELECT id, payment_due, payment_status, payment_option, stripe_customer_id
      FROM attendees WHERE ref_number = ?
    `).bind(auth.ref).all();

    if (results.length === 0) {
      return createErrorResponse(errors.notFound('Attendee', requestId));
    }

    const attendee = results[0] as {
      id: number;
      payment_due: number;
      payment_status: string;
      payment_option: string;
      stripe_customer_id: string | null;
    };

    // Get total paid
    const { results: paidRows } = await context.env.DB.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total_paid
      FROM payments
      WHERE attendee_id = ? AND status = 'succeeded'
    `).bind(attendee.id).all();

    const totalPaid = (paidRows[0] as { total_paid: number }).total_paid || 0;

    // Get installment schedule if applicable
    let installmentSchedule = null;
    if (attendee.payment_option === 'installments') {
      const { results: schedules } = await context.env.DB.prepare(`
        SELECT total_amount, installment_count, installment_amount, installments_paid, status, next_due_date
        FROM installment_schedules
        WHERE attendee_id = ?
      `).bind(attendee.id).all();

      if (schedules.length > 0) {
        installmentSchedule = schedules[0];
      }
    }

    return createResponse({
      payment_due: attendee.payment_due,
      payment_status: attendee.payment_status,
      payment_option: attendee.payment_option,
      total_paid_pence: totalPaid,
      has_stripe_customer: !!attendee.stripe_customer_id,
      installment_schedule: installmentSchedule,
    });

  } catch (error) {
    console.error(`[${requestId}] Payment status error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
