// POST /api/payments/flexible-plan/installments/:id/bank-transfer
//
// Records that the attendee intends to pay this installment by manual
// bank transfer, and returns the bank details + a unique reference they
// should quote on the transfer.
//
// Sets the row status to 'pending_bank'. An admin then reconciles the
// transfer offline and (today) updates the row to 'paid' via the admin
// payments UI (or a future endpoint). Until that happens the row stays
// pending and the attendee dashboard shows "Awaiting confirmation".

import type { PagesContext } from '../../../../../_shared/types.js';
import { createResponse, checkAttendeeAuth, handleCORS } from '../../../../../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../../../../_shared/errors.js';
import type { FlexibleInstallmentRow, FlexiblePlanRow } from '../../../../../_shared/flexible-plans.js';

interface AttendeeRow {
  id: number;
  ref_number: string;
  name: string;
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

    const aRes = await context.env.DB.prepare(
      'SELECT id, ref_number, name FROM attendees WHERE ref_number = ?',
    ).bind(auth.ref).all();
    if (!aRes.results.length) return createErrorResponse(errors.notFound('Attendee', requestId));
    const attendee = aRes.results[0] as unknown as AttendeeRow;

    const iRes = await context.env.DB.prepare(`
      SELECT i.*, p.attendee_id AS plan_attendee_id, p.status AS plan_status
      FROM flexible_installments i
      JOIN flexible_payment_plans p ON p.id = i.plan_id
      WHERE i.id = ?
    `).bind(installmentId).all();
    if (!iRes.results.length) return createErrorResponse(errors.notFound('Installment', requestId));
    const row = iRes.results[0] as unknown as FlexibleInstallmentRow & { plan_attendee_id: number; plan_status: FlexiblePlanRow['status'] };

    if (row.plan_attendee_id !== attendee.id) {
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

    // Reference format: <REF>-FP<plan>-<n> e.g. REF260012-FP3-2
    // Includes plan id so an admin reconciling can distinguish between
    // multiple plans for the same attendee over time.
    const reference = `${attendee.ref_number}-FP${row.plan_id}-${row.installment_number}`;

    await context.env.DB.prepare(`
      UPDATE flexible_installments
      SET status = 'pending_bank',
          payment_method = 'bank_transfer',
          bank_transfer_reference = ?
      WHERE id = ?
    `).bind(reference, row.id).run();

    return createResponse({
      success: true,
      message: 'Bank transfer recorded. Your payment will be confirmed once the funds are received.',
      reference,
      amount: row.amount,
      bank_details: {
        account_name: context.env.BANK_ACCOUNT_NAME || 'Cloverleaf Christian Centre',
        sort_code: context.env.BANK_SORT_CODE || 'See email/portal',
        account_number: context.env.BANK_ACCOUNT_NUMBER || 'See email/portal',
        reference,
      },
    }, 201);
  } catch (error) {
    console.error(`[${requestId}] flex installment bank-transfer error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
