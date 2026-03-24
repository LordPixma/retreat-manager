import type { PagesContext } from '../../_shared/types.js';
import { createResponse, checkAttendeeAuth, handleCORS } from '../../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../_shared/errors.js';

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

// GET /api/payments/history
export async function onRequestGet(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const auth = await checkAttendeeAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!auth) {
      return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));
    }

    // Get attendee ID from ref
    const { results: attendeeRows } = await context.env.DB.prepare(
      'SELECT id FROM attendees WHERE ref_number = ?'
    ).bind(auth.ref).all();

    if (attendeeRows.length === 0) {
      return createErrorResponse(errors.notFound('Attendee', requestId));
    }

    const attendeeId = (attendeeRows[0] as { id: number }).id;

    // Get payments
    const { results: payments } = await context.env.DB.prepare(`
      SELECT id, amount, currency, status, payment_type, installment_number, installment_total, description, paid_at, created_at
      FROM payments
      WHERE attendee_id = ?
      ORDER BY created_at DESC
    `).bind(attendeeId).all();

    // Get installment schedule
    const { results: schedules } = await context.env.DB.prepare(`
      SELECT total_amount, installment_count, installment_amount, installments_paid, status, next_due_date
      FROM installment_schedules
      WHERE attendee_id = ?
    `).bind(attendeeId).all();

    return createResponse({
      payments,
      installment_schedule: schedules.length > 0 ? schedules[0] : null,
    });

  } catch (error) {
    console.error(`[${requestId}] Payment history error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
