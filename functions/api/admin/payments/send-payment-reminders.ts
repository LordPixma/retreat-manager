import type { PagesContext } from '../../../_shared/types.js';
import { createResponse, checkAdminAuth, handleCORS } from '../../../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../../_shared/errors.js';
import { escapeHtml } from '../../../_shared/sanitize.js';

// Resend's /emails/batch endpoint accepts up to 100 messages in one call,
// keeping subrequest count proportional to ceil(N/100). Stops the previous
// per-recipient loop from blowing past Cloudflare Workers' free-tier
// subrequest cap around 25-50 emails.
const RESEND_BATCH_MAX = 100;

interface ReminderRow {
  id: number;
  name: string;
  email: string;
  ref_number: string;
  payment_due: number;
  payment_option: string;
}

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

// POST /api/admin/payments/send-payment-reminders — email all attendees with outstanding balances
export async function onRequestPost(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));

    if (!context.env.RESEND_API_KEY || !context.env.FROM_EMAIL) {
      return createErrorResponse(errors.badRequest('Email service not configured', requestId));
    }

    const retreatName = context.env.RETREAT_NAME || 'Growth and Wisdom Retreat';
    const portalUrl = context.env.PORTAL_URL || 'https://retreat.cloverleafchristiancentre.org';

    const { results } = await context.env.DB.prepare(`
      SELECT id, name, email, ref_number, payment_due, payment_option
      FROM attendees
      WHERE payment_due > 0 AND email IS NOT NULL AND email != '' AND (is_archived = 0 OR is_archived IS NULL)
    `).all();

    const rows = results as unknown as ReminderRow[];
    if (rows.length === 0) {
      return createResponse({ message: 'No attendees with outstanding balances', sent: 0, total: 0 });
    }

    let sent = 0;
    const errors_list: string[] = [];

    for (let i = 0; i < rows.length; i += RESEND_BATCH_MAX) {
      const slice = rows.slice(i, i + RESEND_BATCH_MAX);
      const payload = slice.map(row => ({
        from: context.env.FROM_EMAIL,
        to: [row.email],
        subject: `Payment Reminder - £${row.payment_due.toFixed(2)} Outstanding - ${retreatName}`,
        html: buildReminderHtml(row, retreatName, portalUrl),
      }));

      try {
        const response = await fetch('https://api.resend.com/emails/batch', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${context.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (response.ok) {
          sent += slice.length;
        } else {
          errors_list.push(`Batch ${i / RESEND_BATCH_MAX + 1}: ${response.status} ${await response.text()}`);
        }
      } catch (err) {
        errors_list.push(`Batch ${i / RESEND_BATCH_MAX + 1}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    try {
      await context.env.DB.prepare(
        'INSERT INTO audit_log (admin_user, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)'
      ).bind(admin.user, 'send_payment_reminders', 'system', 0, JSON.stringify({ sent, total: rows.length, errors: errors_list })).run();
    } catch (err) {
      console.warn(`[${requestId}] audit_log write failed`, err);
    }

    return createResponse({
      message: `Sent ${sent} payment reminders`,
      sent,
      total: rows.length,
      errors: errors_list,
    });

  } catch (error) {
    console.error(`[${requestId}] Payment reminder error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}

function buildReminderHtml(row: ReminderRow, retreatName: string, portalUrl: string): string {
  return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
    <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:30px;text-align:center;border-radius:12px 12px 0 0;">
      <h1 style="color:white;margin:0;">Payment Reminder</h1></div>
    <div style="padding:30px;background:#f8fafc;border-radius:0 0 12px 12px;">
      <p>Dear ${escapeHtml(row.name)},</p>
      <p>This is a friendly reminder that you have an outstanding balance for the <strong>${escapeHtml(retreatName)}</strong>.</p>
      <div style="background:white;padding:20px;border-radius:8px;border-left:4px solid #f59e0b;margin:20px 0;">
        <p style="margin:0 0 8px;"><strong>Amount Due:</strong> £${row.payment_due.toFixed(2)}</p>
        <p style="margin:0;"><strong>Reference:</strong> ${escapeHtml(row.ref_number)}</p>
      </div>
      <div style="text-align:center;margin:25px 0;">
        <a href="${escapeHtml(portalUrl)}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;text-decoration:none;border-radius:8px;font-weight:600;">Pay Now</a>
      </div>
      <p style="color:#6b7280;font-size:0.85rem;">If you have already made payment, please disregard this reminder.</p>
      <p style="color:#6b7280;font-size:0.85rem;">— The ${escapeHtml(retreatName)} Team</p>
    </div></div>`;
}
