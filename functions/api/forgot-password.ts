// POST /api/forgot-password
// Body: { ref: string, email: string }
//
// Self-service attendee password recovery. If the reference number and email
// match an account, a temporary password is generated, stored, the account is
// flagged must_reset_password = 1, and the temp password is emailed to the
// address ON FILE (never to a caller-supplied address). The attendee then logs
// in with the temp password and is walked through choosing their own via the
// existing forced-reset flow.
//
// Security notes:
//  - Always returns the same generic message whether or not an account matched,
//    so the endpoint can't be used to enumerate accounts.
//  - Rate-limited per reference + IP to blunt abuse / reset-spam.
//  - The temp password only ever goes to the registered email, so a caller who
//    guesses ref+email can't read it — they can only trigger a reset the real
//    owner will see.

import type { PagesContext } from '../_shared/types.js';
import {
  createResponse,
  handleCORS,
  hashPassword,
  checkRateLimit,
  recordLoginAttempt,
} from '../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../_shared/errors.js';
import { generateTempPassword } from '../_shared/temp-password.js';
import { isEmailReady, sendEmail } from '../_shared/email.js';
import { escapeHtml } from '../_shared/sanitize.js';

const GENERIC_MESSAGE =
  'If an account matches those details, a temporary password has been emailed to the address on file. Sign in with it and you’ll be asked to set a new password.';

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

export async function onRequestPost(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const body = await context.request.json().catch(() => ({})) as { ref?: unknown; email?: unknown };
    const ref = typeof body.ref === 'string' ? body.ref.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';

    if (!ref || !email) {
      return createErrorResponse(errors.badRequest('Reference number and email are required', requestId));
    }

    const clientIP = context.request.headers.get('CF-Connecting-IP') ||
                     context.request.headers.get('X-Forwarded-For') ||
                     'unknown';
    const refKey = ref.toUpperCase();

    // Throttle per reference + IP (fails closed on DB error).
    const rateLimit = await checkRateLimit(context.env.DB, refKey, 'forgot', clientIP);
    if (!rateLimit.allowed) {
      return createErrorResponse(errors.rateLimited(Math.ceil((rateLimit.resetTime - Date.now()) / 1000), requestId));
    }

    // Match on reference + email (both case-insensitive); ignore archived rows
    // and rows without an email on file.
    const { results } = await context.env.DB.prepare(`
      SELECT id, name, email, ref_number
      FROM attendees
      WHERE ref_number = ? COLLATE NOCASE
        AND email = ? COLLATE NOCASE
        AND email IS NOT NULL AND email != ''
        AND (is_archived = 0 OR is_archived IS NULL)
    `).bind(ref, email).all();

    // No match, or email delivery isn't configured — record the attempt and
    // return the same generic response so nothing is leaked.
    if (!results.length || !isEmailReady(context.env)) {
      await recordLoginAttempt(context.env.DB, refKey, 'forgot', false, clientIP);
      if (results.length && !isEmailReady(context.env)) {
        console.warn(`[${requestId}] forgot-password matched but email is not configured`);
      }
      return createResponse({ success: true, message: GENERIC_MESSAGE });
    }

    const attendee = results[0] as { id: number; name: string; email: string; ref_number: string };

    const tempPassword = generateTempPassword();
    const hash = await hashPassword(tempPassword);
    await context.env.DB.prepare(
      'UPDATE attendees SET password_hash = ?, must_reset_password = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(hash, attendee.id).run();

    const retreatName = context.env.RETREAT_NAME || 'Growth and Wisdom Retreat';
    const portalUrl = context.env.PORTAL_URL || 'https://retreat.cloverleafchristiancentre.org';
    try {
      await sendEmail(context.env, {
        to: attendee.email, // on-file address only
        subject: `Password reset — ${retreatName}`,
        html: buildForgotHtml({ name: attendee.name, ref: attendee.ref_number, tempPassword, portalUrl, retreatName }),
      });
    } catch (err) {
      console.warn(`[${requestId}] forgot-password email send failed`, err);
    }

    // Record as a handled attempt (keeps the rate-limit bucket ticking).
    await recordLoginAttempt(context.env.DB, refKey, 'forgot', true, clientIP);

    return createResponse({ success: true, message: GENERIC_MESSAGE });

  } catch (error) {
    console.error(`[${requestId}] forgot-password error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}

function buildForgotHtml(o: { name: string; ref: string; tempPassword: string; portalUrl: string; retreatName: string }): string {
  return `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 560px; margin: 0 auto; background: #f8fafc; padding: 2rem;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 1.75rem; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0; font-size: 1.35rem;">Reset your portal password</h1>
        <p style="margin: 0.4rem 0 0 0; opacity: 0.9;">${escapeHtml(o.retreatName)}</p>
      </div>
      <div style="background: white; padding: 1.75rem; border-radius: 0 0 12px 12px;">
        <p style="color:#1f2937; margin:0 0 1rem;">Hi ${escapeHtml(o.name)},</p>
        <p style="color:#4b5563; margin:0 0 1rem; line-height:1.55;">We received a request to reset your retreat portal password. Sign in with the temporary password below and you'll be asked to choose a new one straight away.</p>
        <div style="background:#fef3c7; border:1px solid #fbbf24; padding:1rem 1.25rem; border-radius:8px; margin:1.25rem 0;">
          <table style="width:100%; border-collapse:collapse;">
            <tr><td style="padding:0.35rem 0; color:#6b7280; width:45%;">Reference number</td><td style="padding:0.35rem 0; font-family:monospace; font-weight:600; color:#1f2937;">${escapeHtml(o.ref)}</td></tr>
            <tr><td style="padding:0.35rem 0; color:#6b7280;">Temporary password</td><td style="padding:0.35rem 0; font-family:monospace; font-weight:600; color:#92400e;">${escapeHtml(o.tempPassword)}</td></tr>
          </table>
        </div>
        <div style="text-align:center; margin:1.5rem 0 0.5rem;">
          <a href="${escapeHtml(o.portalUrl)}" style="display:inline-block; background:linear-gradient(135deg,#667eea,#764ba2); color:white; padding:0.8rem 1.6rem; border-radius:8px; text-decoration:none; font-weight:600;">Open Portal</a>
        </div>
        <p style="color:#9ca3af; font-size:0.8rem; margin:1.25rem 0 0; text-align:center;">If you didn't request this, you can ignore this email — but consider telling the retreat team.</p>
      </div>
    </div>`;
}
