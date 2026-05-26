// GET /api/admin/payments/flexible-plans
//
// Admin-side view of every flexible-plan in the system, joined with
// attendee identity (so the admin doesn't have to cross-reference an
// attendee id) and each plan's installments. Single endpoint serving
// the Payments tab's "Custom Plans" section.
//
// Default returns active + completed (last 90 days); pass ?status=all
// to include cancelled/older rows. Cap is 200 plans — the org isn't
// going to need pagination for this dataset for years.

import type { PagesContext } from '../../../../_shared/types.js';
import { createResponse, checkAdminAuth, handleCORS } from '../../../../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../../../_shared/errors.js';

interface PlanRow {
  id: number;
  attendee_id: number;
  attendee_name: string;
  attendee_ref: string;
  attendee_email: string | null;
  total_amount: number;
  months_count: number;
  start_date: string;
  status: 'active' | 'completed' | 'cancelled';
  reminders_enabled: number;
  reminder_days_before: number;
  created_at: string;
  cancelled_at: string | null;
}

interface InstallmentRow {
  id: number;
  plan_id: number;
  installment_number: number;
  due_date: string;
  amount: number;
  status: 'upcoming' | 'pending_bank' | 'paid' | 'overdue' | 'cancelled';
  payment_method: 'card' | 'bank_transfer' | null;
  paid_at: string | null;
  last_reminder_sent_at: string | null;
  bank_transfer_reference: string | null;
}

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));

    const url = new URL(context.request.url);
    const statusFilter = url.searchParams.get('status') || 'active';

    let where = `p.status = 'active'`;
    if (statusFilter === 'all') {
      where = '1=1';
    } else if (['active', 'completed', 'cancelled'].includes(statusFilter)) {
      where = `p.status = '${statusFilter}'`;
    }

    const { results: planRows } = await context.env.DB.prepare(`
      SELECT
        p.id, p.attendee_id, p.total_amount, p.months_count, p.start_date,
        p.status, p.reminders_enabled, p.reminder_days_before,
        p.created_at, p.cancelled_at,
        a.name AS attendee_name, a.ref_number AS attendee_ref, a.email AS attendee_email
      FROM flexible_payment_plans p
      JOIN attendees a ON a.id = p.attendee_id
      WHERE ${where}
      ORDER BY (p.status = 'active') DESC, p.created_at DESC
      LIMIT 200
    `).all();

    const plans = planRows as unknown as PlanRow[];

    if (plans.length === 0) {
      return createResponse({ plans: [], count: 0 });
    }

    // One IN-list query to pull all installments at once — cheaper than
    // a per-plan round-trip when there are dozens of plans on the page.
    const placeholders = plans.map(() => '?').join(',');
    const { results: instRows } = await context.env.DB.prepare(`
      SELECT id, plan_id, installment_number, due_date, amount, status,
             payment_method, paid_at, last_reminder_sent_at, bank_transfer_reference
      FROM flexible_installments
      WHERE plan_id IN (${placeholders})
      ORDER BY plan_id ASC, installment_number ASC
    `).bind(...plans.map((p) => p.id)).all();

    const installmentsByPlan = new Map<number, InstallmentRow[]>();
    for (const r of instRows as unknown as InstallmentRow[]) {
      const list = installmentsByPlan.get(r.plan_id) || [];
      list.push(r);
      installmentsByPlan.set(r.plan_id, list);
    }

    const enriched = plans.map((p) => {
      const inst = installmentsByPlan.get(p.id) || [];
      const paid = inst.filter((i) => i.status === 'paid').length;
      const overdue = inst.filter((i) => i.status === 'overdue').length;
      const pendingBank = inst.filter((i) => i.status === 'pending_bank').length;
      const paidPence = inst.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
      return {
        ...p,
        installments: inst,
        installments_paid: paid,
        installments_overdue: overdue,
        installments_pending_bank: pendingBank,
        paid_amount_pence: paidPence,
      };
    });

    return createResponse({ plans: enriched, count: enriched.length });
  } catch (error) {
    console.error(`[${requestId}] admin flex-plans list error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
