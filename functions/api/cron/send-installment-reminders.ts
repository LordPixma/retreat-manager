// POST /api/cron/send-installment-reminders
//
// Daily sweep that emails attendees ahead of upcoming flexible-plan
// installments. Intended to be invoked by a scheduled trigger (Cloudflare
// cron, GitHub Actions, cron-job.org, etc.) — protected by CRON_SECRET
// presented as `X-Cron-Secret: <value>`, since Pages Functions can't
// natively check Cloudflare's own scheduled handler.
//
// Two passes per run:
//   1. UPCOMING — installments whose due_date falls in the next
//      reminder_days_before days (relative to today) and haven't been
//      reminded yet today. One "heads-up" email per installment.
//   2. OVERDUE  — installments whose due_date is in the past and are
//      still upcoming/pending_bank. Flips them to status='overdue' and
//      sends an "overdue" email (rate-limited to once per 7 days per
//      installment so we don't spam).
//
// Reminders use the same email helper as the rest of the codebase
// (Cloudflare Email Send if bound, otherwise Resend HTTP API).

import type { PagesContext } from '../../_shared/types.js';
import { handleCORS, createResponse } from '../../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../_shared/errors.js';
import { isEmailReady, sendEmailsBulk, type OutboundEmail } from '../../_shared/email.js';

interface DueRow {
  installment_id: number;
  installment_number: number;
  due_date: string;
  amount: number;
  status: 'upcoming' | 'pending_bank' | 'overdue';
  last_reminder_sent_at: string | null;
  plan_id: number;
  reminder_days_before: number;
  attendee_id: number;
  attendee_name: string;
  attendee_email: string | null;
  attendee_ref: string;
}

const OVERDUE_REMINDER_INTERVAL_DAYS = 7;

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

export async function onRequestPost(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();
  try {
    const expected = context.env.CRON_SECRET;
    if (!expected) {
      // Fail closed — better to make the cron silently broken than to
      // leave the endpoint world-exposed because someone forgot to set
      // the secret.
      return createErrorResponse(errors.forbidden('CRON_SECRET not configured on this deployment', requestId));
    }
    const presented = context.request.headers.get('X-Cron-Secret') || '';
    if (presented !== expected) {
      return createErrorResponse(errors.forbidden('Invalid cron secret', requestId));
    }

    if (!isEmailReady(context.env)) {
      // Don't half-run: if email isn't configured the sweep would mark
      // rows as "reminder sent" without actually sending. Return early.
      return createResponse({ skipped: true, reason: 'email not configured' });
    }

    const todayIso = new Date().toISOString().slice(0, 10);
    const portalUrl = context.env.PORTAL_URL || 'https://retreat.cloverleafchristiancentre.org';
    const retreatName = context.env.RETREAT_NAME || 'Growth and Wisdom Retreat';

    // --- UPCOMING pass ----------------------------------------------------
    // Find installments where due_date is within the plan's
    // reminder_days_before window from today AND we haven't already
    // reminded today.
    const { results: upcomingRows } = await context.env.DB.prepare(`
      SELECT
        i.id              AS installment_id,
        i.installment_number,
        i.due_date,
        i.amount,
        i.status,
        i.last_reminder_sent_at,
        p.id              AS plan_id,
        p.reminder_days_before,
        a.id              AS attendee_id,
        a.name            AS attendee_name,
        a.email           AS attendee_email,
        a.ref_number      AS attendee_ref
      FROM flexible_installments i
      JOIN flexible_payment_plans p ON p.id = i.plan_id
      JOIN attendees a ON a.id = p.attendee_id
      WHERE p.status = 'active'
        AND p.reminders_enabled = 1
        AND i.status = 'upcoming'
        AND julianday(i.due_date) - julianday(?) <= p.reminder_days_before
        AND julianday(i.due_date) - julianday(?) >= 0
        AND (i.last_reminder_sent_at IS NULL OR date(i.last_reminder_sent_at) < date(?))
        AND a.email IS NOT NULL
        AND a.email != ''
    `).bind(todayIso, todayIso, todayIso).all();

    const upcoming = upcomingRows as unknown as DueRow[];

    // --- OVERDUE pass -----------------------------------------------------
    // Flip status=upcoming → overdue when due_date has passed, then send
    // overdue reminders. pending_bank rows aren't flipped automatically
    // (they're already in the admin's reconciliation queue).
    await context.env.DB.prepare(`
      UPDATE flexible_installments
      SET status = 'overdue'
      WHERE status = 'upcoming'
        AND julianday(?) > julianday(due_date)
        AND plan_id IN (SELECT id FROM flexible_payment_plans WHERE status = 'active')
    `).bind(todayIso).run();

    const { results: overdueRows } = await context.env.DB.prepare(`
      SELECT
        i.id              AS installment_id,
        i.installment_number,
        i.due_date,
        i.amount,
        i.status,
        i.last_reminder_sent_at,
        p.id              AS plan_id,
        p.reminder_days_before,
        a.id              AS attendee_id,
        a.name            AS attendee_name,
        a.email           AS attendee_email,
        a.ref_number      AS attendee_ref
      FROM flexible_installments i
      JOIN flexible_payment_plans p ON p.id = i.plan_id
      JOIN attendees a ON a.id = p.attendee_id
      WHERE p.status = 'active'
        AND p.reminders_enabled = 1
        AND i.status = 'overdue'
        AND (i.last_reminder_sent_at IS NULL OR julianday(?) - julianday(date(i.last_reminder_sent_at)) >= ?)
        AND a.email IS NOT NULL
        AND a.email != ''
    `).bind(todayIso, OVERDUE_REMINDER_INTERVAL_DAYS).all();

    const overdue = overdueRows as unknown as DueRow[];

    // Build emails and send in a single bulk call.
    const emails: { id: number; row: DueRow; email: OutboundEmail }[] = [];
    for (const row of upcoming) {
      emails.push({
        id: row.installment_id,
        row,
        email: {
          to: row.attendee_email!,
          subject: `Reminder: £${(row.amount / 100).toFixed(2)} due ${friendlyDate(row.due_date)} — ${retreatName}`,
          html: buildReminderHtml(row, retreatName, portalUrl, 'upcoming'),
        },
      });
    }
    for (const row of overdue) {
      emails.push({
        id: row.installment_id,
        row,
        email: {
          to: row.attendee_email!,
          subject: `Overdue: £${(row.amount / 100).toFixed(2)} was due ${friendlyDate(row.due_date)} — ${retreatName}`,
          html: buildReminderHtml(row, retreatName, portalUrl, 'overdue'),
        },
      });
    }

    if (emails.length === 0) {
      return createResponse({
        sent: 0,
        upcoming_candidates: 0,
        overdue_candidates: 0,
      });
    }

    const result = await sendEmailsBulk(
      context.env,
      emails.map((e) => e.email),
      emails.map((e) => e.id),
    );

    // Mark sent rows so they don't get re-sent today.
    if (result.sentKeys.length) {
      const stmts = result.sentKeys.map((id) =>
        context.env.DB.prepare(
          'UPDATE flexible_installments SET last_reminder_sent_at = CURRENT_TIMESTAMP WHERE id = ?',
        ).bind(id),
      );
      await context.env.DB.batch(stmts);
    }

    return createResponse({
      sent: result.sentKeys.length,
      failed: result.failedKeys.length,
      upcoming_candidates: upcoming.length,
      overdue_candidates: overdue.length,
      error: result.errorMessage,
    });
  } catch (error) {
    console.error(`[${requestId}] cron reminder sweep error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}

function friendlyDate(iso: string): string {
  // iso is YYYY-MM-DD; render as e.g. "5 Jun 2026" without depending on
  // a heavyweight locale module.
  const d = new Date(iso + 'T00:00:00Z');
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function buildReminderHtml(
  row: DueRow,
  retreatName: string,
  portalUrl: string,
  kind: 'upcoming' | 'overdue',
): string {
  const amount = `£${(row.amount / 100).toFixed(2)}`;
  const headline = kind === 'upcoming'
    ? `Your next installment is due ${friendlyDate(row.due_date)}`
    : `Installment overdue (was due ${friendlyDate(row.due_date)})`;
  const accent = kind === 'upcoming' ? '#667eea' : '#dc2626';
  const intro = kind === 'upcoming'
    ? `This is a friendly reminder that installment #${row.installment_number} of <strong>${amount}</strong> is due on <strong>${friendlyDate(row.due_date)}</strong>.`
    : `Installment #${row.installment_number} of <strong>${amount}</strong> was due on <strong>${friendlyDate(row.due_date)}</strong> and is now overdue.`;

  return `<!doctype html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#222">
    <h2 style="color:${accent}">${headline}</h2>
    <p>Hi ${escapeHtml(row.attendee_name)},</p>
    <p>${intro}</p>
    <p>You can pay by card or arrange a bank transfer from your retreat dashboard:</p>
    <p><a href="${portalUrl}" style="display:inline-block;padding:10px 18px;background:${accent};color:#fff;text-decoration:none;border-radius:6px">Open ${escapeHtml(retreatName)} dashboard</a></p>
    <p style="color:#888;font-size:12px;margin-top:24px">If you've already paid, please ignore this email — your dashboard will update once we confirm receipt.</p>
  </body></html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
