// POST /api/admin/payments/flexible-plans/installments/:id/mark-paid
//
// Admin marks a flexible-installment row as paid. The path used today
// for bank-transfer reconciliation: an attendee selected "I'll pay by
// bank transfer", the row is in 'pending_bank' status, the funds land
// in the account, an admin hits this endpoint to flip status -> paid.
//
// Also handles the edge case where an admin needs to manually mark an
// 'upcoming' row paid (cash on the day, cheque, etc.) — same effect.
// Refuses on rows already paid/cancelled so a double-credit can't
// happen by accident.
//
// Side effects mirror what the Stripe webhook does for the card path:
//   - row.status = 'paid'
//   - row.paid_at = now
//   - attendee.payment_due credited by row.amount
//   - plan.status = 'completed' if no more open rows on the plan
//
// Optional body { notes: string } gets stored on the row for an audit
// trail (e.g. "bank ref ABC123, received 2026-05-26").

import type { PagesContext } from '../../../../../../_shared/types.js';
import { createResponse, checkAdminAuth, handleCORS } from '../../../../../../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../../../../../_shared/errors.js';
import { penceToPounds } from '../../../../../../_shared/stripe.js';

interface RowWithPlan {
  id: number;
  amount: number;
  status: string;
  plan_id: number;
  attendee_id: number;
  plan_status: string;
}

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

export async function onRequestPost(context: PagesContext<{ id: string }>): Promise<Response> {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));

    const installmentId = Number(context.params.id);
    if (!Number.isInteger(installmentId) || installmentId <= 0) {
      return createErrorResponse(errors.badRequest('Invalid installment id', requestId));
    }

    let notes: string | null = null;
    try {
      const body = await context.request.json() as { notes?: string };
      if (body?.notes) notes = String(body.notes).slice(0, 500);
    } catch {
      // Empty body is fine — notes are optional.
    }

    const lookup = await context.env.DB.prepare(`
      SELECT i.id, i.amount, i.status,
             p.id AS plan_id, p.attendee_id, p.status AS plan_status
      FROM flexible_installments i
      JOIN flexible_payment_plans p ON p.id = i.plan_id
      WHERE i.id = ?
    `).bind(installmentId).all();
    if (!lookup.results.length) return createErrorResponse(errors.notFound('Installment', requestId));
    const row = lookup.results[0] as unknown as RowWithPlan;

    if (row.status === 'paid') {
      return createErrorResponse(errors.badRequest('Installment is already paid', requestId));
    }
    if (row.status === 'cancelled') {
      return createErrorResponse(errors.badRequest('Cancelled installment cannot be marked paid', requestId));
    }
    if (row.plan_status !== 'active') {
      return createErrorResponse(errors.badRequest('Parent plan is not active', requestId));
    }

    // Mark paid. Preserve payment_method if already set (bank_transfer
    // from the attendee's pending_bank flow); otherwise default to
    // bank_transfer since that's the realistic admin-mark-paid case.
    await context.env.DB.prepare(`
      UPDATE flexible_installments
      SET status = 'paid',
          payment_method = COALESCE(payment_method, 'bank_transfer'),
          paid_at = CURRENT_TIMESTAMP,
          notes = COALESCE(?, notes)
      WHERE id = ?
    `).bind(notes, installmentId).run();

    // Credit attendee.payment_due.
    const paidPounds = penceToPounds(row.amount);
    const { results: aRows } = await context.env.DB.prepare(
      'SELECT payment_due FROM attendees WHERE id = ?',
    ).bind(row.attendee_id).all();
    if (aRows.length) {
      const currentDue = (aRows[0] as { payment_due: number }).payment_due || 0;
      const newDue = Math.max(0, currentDue - paidPounds);
      const newStatus = newDue <= 0 ? 'paid' : 'partial';
      await context.env.DB.prepare(
        `UPDATE attendees SET payment_due = ?, payment_status = ? WHERE id = ?`,
      ).bind(newDue, newStatus, row.attendee_id).run();
    }

    // Plan-completion check.
    const { results: openRows } = await context.env.DB.prepare(
      `SELECT COUNT(*) AS open_count FROM flexible_installments
       WHERE plan_id = ? AND status IN ('upcoming', 'pending_bank', 'overdue')`,
    ).bind(row.plan_id).all();
    if ((openRows[0] as { open_count: number }).open_count === 0) {
      await context.env.DB.prepare(
        `UPDATE flexible_payment_plans SET status = 'completed' WHERE id = ?`,
      ).bind(row.plan_id).run();
    }

    // Audit log (best-effort).
    try {
      await context.env.DB.prepare(
        `INSERT INTO audit_log (admin_user, action, entity_type, entity_id, details)
         VALUES (?, 'flex_installment_marked_paid', 'flexible_installment', ?, ?)`,
      ).bind(
        admin.user,
        installmentId,
        JSON.stringify({ amount_pence: row.amount, attendee_id: row.attendee_id, notes }),
      ).run();
    } catch (err) {
      console.warn(`[${requestId}] audit log write failed`, err);
    }

    return createResponse({ success: true, installment_id: installmentId, amount_pence: row.amount });
  } catch (error) {
    console.error(`[${requestId}] admin mark-paid error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
