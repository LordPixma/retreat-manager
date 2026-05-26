// POST   /api/payments/flexible-plan — attendee creates a new plan
// GET    /api/payments/flexible-plan — attendee fetches their active plan
// DELETE /api/payments/flexible-plan — attendee cancels their active plan
//
// Attendee-authenticated only. Admin-driven flows (if added later) should
// hang off /api/admin/payments/ so the access checks stay clean.
//
// "Parallel system" design: the legacy installment_schedules table (3 or 4
// fixed installments, created lazily on first Stripe checkout) is untouched.
// This endpoint refuses to create a flexible plan while ANY plan is active
// against the same attendee to prevent two schedules racing to settle the
// same outstanding balance.

import type { PagesContext } from '../../../_shared/types.js';
import { createResponse, checkAttendeeAuth, handleCORS } from '../../../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../../_shared/errors.js';
import { poundsToPence } from '../../../_shared/stripe.js';
import { isEmailReady, sendEmail } from '../../../_shared/email.js';
import {
  MIN_MONTHS,
  MAX_MONTHS,
  MIN_REMINDER_DAYS,
  MAX_REMINDER_DAYS,
  defaultStartDate,
  generateSchedule,
  hasActiveAnyPlan,
  loadActivePlanWithInstallments,
} from '../../../_shared/flexible-plans.js';

interface AttendeeRow {
  id: number;
  ref_number: string;
  name: string;
  email: string | null;
  payment_due: number;
}

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

export async function onRequestPost(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();
  try {
    const auth = await checkAttendeeAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!auth) return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));

    const body = await context.request.json() as {
      months?: number;
      reminders_enabled?: boolean;
      reminder_days_before?: number;
      start_date?: string;
    };

    const months = Number(body.months);
    if (!Number.isInteger(months) || months < MIN_MONTHS || months > MAX_MONTHS) {
      return createErrorResponse(errors.badRequest(`months must be an integer between ${MIN_MONTHS} and ${MAX_MONTHS}`, requestId));
    }

    const remindersEnabled = body.reminders_enabled !== false; // default true
    let reminderDays = body.reminder_days_before ?? 3;
    if (!Number.isInteger(reminderDays) || reminderDays < MIN_REMINDER_DAYS || reminderDays > MAX_REMINDER_DAYS) {
      return createErrorResponse(errors.badRequest(`reminder_days_before must be between ${MIN_REMINDER_DAYS} and ${MAX_REMINDER_DAYS}`, requestId));
    }

    let startDate = body.start_date;
    if (startDate && !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      return createErrorResponse(errors.badRequest('start_date must be YYYY-MM-DD', requestId));
    }
    if (!startDate) startDate = defaultStartDate();

    const { results } = await context.env.DB.prepare(
      'SELECT id, ref_number, name, email, payment_due FROM attendees WHERE ref_number = ?',
    ).bind(auth.ref).all();
    if (!results.length) return createErrorResponse(errors.notFound('Attendee', requestId));
    const attendee = results[0] as unknown as AttendeeRow;

    if (attendee.payment_due <= 0) {
      return createErrorResponse(errors.badRequest('No payment due — nothing to schedule', requestId));
    }

    if (await hasActiveAnyPlan(context.env, attendee.id)) {
      return createErrorResponse(errors.conflict('You already have an active payment plan. Cancel it first to set up a new one.', requestId));
    }

    const totalPence = poundsToPence(attendee.payment_due);

    // Generate schedule client-side first so we can fail fast if validation
    // catches anything, then persist plan + rows together.
    const rows = generateSchedule(totalPence, months, startDate);

    const planInsert = await context.env.DB.prepare(`
      INSERT INTO flexible_payment_plans (
        attendee_id, total_amount, months_count, start_date,
        status, reminders_enabled, reminder_days_before
      ) VALUES (?, ?, ?, ?, 'active', ?, ?)
    `).bind(
      attendee.id, totalPence, months, startDate,
      remindersEnabled ? 1 : 0, reminderDays,
    ).run();

    const planId = planInsert.meta.last_row_id;
    if (!planId) {
      return createErrorResponse(handleError(new Error('Failed to create plan'), requestId));
    }

    // D1 supports batch() for atomic multi-row inserts. We don't need
    // strict atomicity here (a stranded plan with zero rows would be
    // detected on GET and the attendee can cancel + recreate), but
    // batching is one round-trip instead of `months` round-trips.
    const stmts = rows.map((r) =>
      context.env.DB.prepare(`
        INSERT INTO flexible_installments (plan_id, installment_number, due_date, amount, status)
        VALUES (?, ?, ?, ?, 'upcoming')
      `).bind(planId, r.installment_number, r.due_date, r.amount),
    );
    await context.env.DB.batch(stmts);

    // Best-effort confirmation email — never block plan creation if email
    // sending is unconfigured or fails.
    if (attendee.email && isEmailReady(context.env)) {
      const retreatName = context.env.RETREAT_NAME || 'Growth and Wisdom Retreat';
      const portalUrl = context.env.PORTAL_URL || 'https://retreat.cloverleafchristiancentre.org';
      try {
        await sendEmail(context.env, {
          to: attendee.email,
          subject: `Your ${retreatName} payment plan is set up`,
          html: buildConfirmationHtml({
            attendeeName: attendee.name,
            retreatName,
            portalUrl,
            totalPence,
            months,
            rows,
            remindersEnabled,
            reminderDays,
          }),
        });
      } catch (err) {
        console.warn(`[${requestId}] plan-confirmation email send failed`, err);
      }
    }

    return createResponse({
      plan: {
        id: planId,
        attendee_id: attendee.id,
        total_amount: totalPence,
        months_count: months,
        start_date: startDate,
        status: 'active',
        reminders_enabled: remindersEnabled,
        reminder_days_before: reminderDays,
      },
      installments: rows,
    }, 201);
  } catch (error) {
    console.error(`[${requestId}] create flexible plan error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();
  try {
    const auth = await checkAttendeeAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!auth) return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));

    const { results } = await context.env.DB.prepare(
      'SELECT id FROM attendees WHERE ref_number = ?',
    ).bind(auth.ref).all();
    if (!results.length) return createErrorResponse(errors.notFound('Attendee', requestId));
    const attendeeId = (results[0] as { id: number }).id;

    const data = await loadActivePlanWithInstallments(context.env, attendeeId);
    if (!data) return createResponse({ plan: null, installments: [] });

    return createResponse(data);
  } catch (error) {
    console.error(`[${requestId}] get flexible plan error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}

export async function onRequestDelete(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();
  try {
    const auth = await checkAttendeeAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!auth) return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));

    const { results } = await context.env.DB.prepare(
      'SELECT id FROM attendees WHERE ref_number = ?',
    ).bind(auth.ref).all();
    if (!results.length) return createErrorResponse(errors.notFound('Attendee', requestId));
    const attendeeId = (results[0] as { id: number }).id;

    const data = await loadActivePlanWithInstallments(context.env, attendeeId);
    if (!data) return createErrorResponse(errors.notFound('Active plan', requestId));

    // Cancel the plan and any still-upcoming/pending_bank installments.
    // Paid rows stay paid (they carry receipts the attendee may want to
    // reference) — only the schedule itself stops being active.
    await context.env.DB.batch([
      context.env.DB.prepare(
        `UPDATE flexible_payment_plans
         SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
      ).bind(data.plan.id),
      context.env.DB.prepare(
        `UPDATE flexible_installments
         SET status = 'cancelled'
         WHERE plan_id = ? AND status IN ('upcoming', 'pending_bank', 'overdue')`,
      ).bind(data.plan.id),
    ]);

    return createResponse({ success: true, plan_id: data.plan.id });
  } catch (error) {
    console.error(`[${requestId}] cancel flexible plan error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}

function buildConfirmationHtml(params: {
  attendeeName: string;
  retreatName: string;
  portalUrl: string;
  totalPence: number;
  months: number;
  rows: { installment_number: number; due_date: string; amount: number }[];
  remindersEnabled: boolean;
  reminderDays: number;
}): string {
  const fmtGBP = (pence: number) => `£${(pence / 100).toFixed(2)}`;
  const fmtDate = (iso: string) => new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const rowsHtml = params.rows.map((r) =>
    `<tr>
      <td style="padding:8px;border-bottom:1px solid #eee">#${r.installment_number}</td>
      <td style="padding:8px;border-bottom:1px solid #eee">${fmtDate(r.due_date)}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right"><strong>${fmtGBP(r.amount)}</strong></td>
    </tr>`,
  ).join('');
  const remindersLine = params.remindersEnabled
    ? `<p style="color:#555">We'll email you a reminder ${params.reminderDays} day${params.reminderDays === 1 ? '' : 's'} before each due date.</p>`
    : `<p style="color:#555">Reminder emails are turned off for this plan.</p>`;

  return `<!doctype html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#222">
    <h2 style="color:#667eea">Your payment plan is set up</h2>
    <p>Hi ${escapeHtml(params.attendeeName)},</p>
    <p>You've split <strong>${fmtGBP(params.totalPence)}</strong> for <strong>${escapeHtml(params.retreatName)}</strong> across <strong>${params.months} monthly payments</strong>.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <thead><tr>
        <th style="padding:8px;text-align:left;background:#f6f6fb">#</th>
        <th style="padding:8px;text-align:left;background:#f6f6fb">Due</th>
        <th style="padding:8px;text-align:right;background:#f6f6fb">Amount</th>
      </tr></thead>
      <tbody>${rowsHtml}</tbody>
    </table>
    ${remindersLine}
    <p><a href="${params.portalUrl}" style="display:inline-block;padding:10px 18px;background:#667eea;color:#fff;text-decoration:none;border-radius:6px">View your plan and pay</a></p>
    <p style="color:#888;font-size:12px;margin-top:24px">You can pay each installment by card or bank transfer at any time from your retreat dashboard.</p>
  </body></html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
