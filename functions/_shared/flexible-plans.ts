// Helpers for the flexible-installment plan system (migration 021).
//
// Kept separate from _shared/stripe.ts so the legacy 3/4-installment code
// path in checkout.ts / bank-transfer.ts stays untouched. Anything that
// touches flexible_payment_plans / flexible_installments goes through here.

import type { Env } from './types.js';

// Outer bounds. Two months is the shortest plan that's meaningfully an
// "installment" plan vs paying in full; 36 months caps the schedule at
// roughly the retreat-planning horizon (longer plans would outlive the
// event they're paying for, which is a different product).
export const MIN_MONTHS = 2;
export const MAX_MONTHS = 36;

// Reminder window — number of days before due_date that the cron sends
// the heads-up email. Bounds keep the email useful (not too early, not
// too late) without giving the attendee a way to disable reminders
// while keeping reminders_enabled=true.
export const MIN_REMINDER_DAYS = 1;
export const MAX_REMINDER_DAYS = 14;

export interface FlexiblePlanRow {
  id: number;
  attendee_id: number;
  total_amount: number;
  months_count: number;
  start_date: string;
  status: 'active' | 'completed' | 'cancelled';
  reminders_enabled: number;
  reminder_days_before: number;
  created_at: string;
  updated_at: string;
  cancelled_at: string | null;
}

export interface FlexibleInstallmentRow {
  id: number;
  plan_id: number;
  installment_number: number;
  due_date: string;
  amount: number;
  status: 'upcoming' | 'pending_bank' | 'paid' | 'overdue' | 'cancelled';
  payment_method: 'card' | 'bank_transfer' | null;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  paid_at: string | null;
  last_reminder_sent_at: string | null;
  bank_transfer_reference: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface GeneratedInstallment {
  installment_number: number;
  due_date: string;
  amount: number;
}

/**
 * Build the per-row schedule for a plan. Splits total_amount evenly
 * across `months` installments, putting any rounding remainder on the
 * final row so the rows sum exactly to total_amount.
 *
 * Due dates step one calendar month forward from start_date. Anchors
 * to the same day-of-month each step, except when the target month is
 * short (e.g. start=Jan 31 → Feb 28). Implementation lets the Date
 * object roll over naturally; callers that need strict end-of-month
 * snapping should do it after this returns.
 */
export function generateSchedule(
  totalAmount: number,
  months: number,
  startDate: string,
): GeneratedInstallment[] {
  if (!Number.isInteger(totalAmount) || totalAmount <= 0) {
    throw new Error('totalAmount must be a positive integer (pence)');
  }
  if (!Number.isInteger(months) || months < MIN_MONTHS || months > MAX_MONTHS) {
    throw new Error(`months must be an integer in [${MIN_MONTHS}, ${MAX_MONTHS}]`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    throw new Error('startDate must be YYYY-MM-DD');
  }

  const base = Math.floor(totalAmount / months);
  const remainder = totalAmount - base * months;

  const [y, m, d] = startDate.split('-').map(Number);
  const rows: GeneratedInstallment[] = [];

  for (let i = 0; i < months; i++) {
    // Date(y, m-1+i, d) handles month overflow into next year cleanly
    // and clamps the day for short target months (e.g. Feb 30 → Mar 2).
    // We want the latter behavior to roll: a Jan 31 start ends up
    // Feb 28/29, then Mar 31 again the following month. Use a fixed
    // day-of-month walk so Jan 31 → Feb 28 → Mar 28 instead of
    // bouncing back to 31. Cleaner cadence for cron reminders.
    const target = new Date(Date.UTC(y, m - 1 + i, d));
    // If the day rolled forward (e.g. Feb 31 → Mar 3), pull it back
    // to the last day of the intended month.
    if (target.getUTCMonth() !== (m - 1 + i) % 12) {
      target.setUTCDate(0); // last day of prior (intended) month
    }
    const due = target.toISOString().slice(0, 10);

    // Put the rounding remainder on the LAST installment, not the first,
    // so the attendee doesn't see an oddly-larger upfront payment in the
    // schedule UI. Difference is at most (months - 1) pence.
    const amount = i === months - 1 ? base + remainder : base;

    rows.push({
      installment_number: i + 1,
      due_date: due,
      amount,
    });
  }

  return rows;
}

/**
 * Today as YYYY-MM-DD in UTC. Centralized so create-plan and cron
 * agree on what "today" means regardless of where they're invoked.
 */
export function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Default start date for a brand-new plan: one calendar month from
 * today. This gives the attendee a buffer before their first payment
 * is due and matches the legacy 3/4-installment flow which also
 * stamps next_due_date = today + 1 month on schedule creation.
 */
export function defaultStartDate(): string {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() + 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Check whether a plan-creation request is allowed for this attendee.
 * Refuses if there's already an active flexible plan OR a legacy
 * installment_schedule still active — running two parallel schedules
 * against the same outstanding balance would let one Stripe payment
 * pay down both and double-dispense receipts.
 */
export async function hasActiveAnyPlan(env: Env, attendeeId: number): Promise<boolean> {
  const flex = await env.DB.prepare(
    `SELECT 1 FROM flexible_payment_plans WHERE attendee_id = ? AND status = 'active' LIMIT 1`,
  ).bind(attendeeId).all();
  if (flex.results.length) return true;

  const legacy = await env.DB.prepare(
    `SELECT 1 FROM installment_schedules WHERE attendee_id = ? AND status = 'active' LIMIT 1`,
  ).bind(attendeeId).all();
  return legacy.results.length > 0;
}

/**
 * Load an attendee's active plan + its installments, ordered by
 * installment_number. Returns null if no active plan.
 */
export async function loadActivePlanWithInstallments(
  env: Env,
  attendeeId: number,
): Promise<{ plan: FlexiblePlanRow; installments: FlexibleInstallmentRow[] } | null> {
  const planRes = await env.DB.prepare(
    `SELECT * FROM flexible_payment_plans
     WHERE attendee_id = ? AND status = 'active'
     ORDER BY id DESC LIMIT 1`,
  ).bind(attendeeId).all();
  if (!planRes.results.length) return null;
  const plan = planRes.results[0] as unknown as FlexiblePlanRow;

  const instRes = await env.DB.prepare(
    `SELECT * FROM flexible_installments
     WHERE plan_id = ?
     ORDER BY installment_number ASC`,
  ).bind(plan.id).all();

  return {
    plan,
    installments: instRes.results as unknown as FlexibleInstallmentRow[],
  };
}
