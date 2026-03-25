import type { PagesContext } from '../../_shared/types.js';
import { createResponse, checkAttendeeAuth, handleCORS } from '../../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../_shared/errors.js';
import { poundsToPence } from '../../_shared/stripe.js';

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

// POST /api/payments/bank-transfer — record a bank transfer payment (pending admin confirmation)
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
      transfer_reference?: string;
    };

    if (!body.payment_type || !['full', 'installment'].includes(body.payment_type)) {
      return createErrorResponse(errors.badRequest('Invalid payment_type', requestId));
    }

    // Get attendee
    const { results } = await context.env.DB.prepare(
      'SELECT id, name, payment_due, payment_option FROM attendees WHERE ref_number = ?'
    ).bind(auth.ref).all();

    if (results.length === 0) {
      return createErrorResponse(errors.notFound('Attendee', requestId));
    }

    const attendee = results[0] as { id: number; name: string; payment_due: number; payment_option: string };

    if (attendee.payment_due <= 0) {
      return createErrorResponse(errors.badRequest('No payment due', requestId));
    }

    const retreatName = context.env.RETREAT_NAME || 'Growth and Wisdom Retreat';
    let amount: number;
    let installmentNumber: number | null = null;
    let installmentTotal: number | null = null;
    let description: string;

    if (body.payment_type === 'full') {
      amount = poundsToPence(attendee.payment_due);
      description = `${retreatName} - Bank Transfer (Full)`;
    } else {
      const count = body.installment_count || 3;
      installmentTotal = count;

      // Check existing schedule
      const { results: scheduleRows } = await context.env.DB.prepare(
        'SELECT * FROM installment_schedules WHERE attendee_id = ? AND status = ?'
      ).bind(attendee.id, 'active').all();

      if (scheduleRows.length > 0) {
        const schedule = scheduleRows[0] as { installments_paid: number; installment_amount: number; installment_count: number };
        installmentNumber = schedule.installments_paid + 1;
        installmentTotal = schedule.installment_count;
        amount = schedule.installment_amount;
      } else {
        const totalPence = poundsToPence(attendee.payment_due);
        const perInstallment = Math.ceil(totalPence / count);
        installmentNumber = 1;

        const nextDue = new Date();
        nextDue.setMonth(nextDue.getMonth() + 1);

        await context.env.DB.prepare(`
          INSERT INTO installment_schedules (attendee_id, total_amount, installment_count, installment_amount, installments_paid, status, next_due_date)
          VALUES (?, ?, ?, ?, 0, 'active', ?)
        `).bind(attendee.id, totalPence, count, perInstallment, nextDue.toISOString().split('T')[0]).run();

        amount = perInstallment;
      }

      description = `${retreatName} - Bank Transfer (Installment ${installmentNumber}/${installmentTotal})`;
    }

    // Record pending payment (awaiting admin confirmation)
    await context.env.DB.prepare(`
      INSERT INTO payments (attendee_id, amount, currency, status, payment_type, installment_number, installment_total, description)
      VALUES (?, ?, 'gbp', 'pending', ?, ?, ?, ?)
    `).bind(
      attendee.id, amount, body.payment_type,
      installmentNumber, installmentTotal, description
    ).run();

    return createResponse({
      message: 'Bank transfer recorded. Your payment will be confirmed once we receive the funds.',
      amount,
      reference: `${auth.ref}-${Date.now()}`,
    }, 201);

  } catch (error) {
    console.error(`[${requestId}] Bank transfer error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
