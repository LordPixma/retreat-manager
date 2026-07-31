// POST /api/admin/attendees/:id/reset-password
// Body: { new_password?: string, notify?: boolean }
//
// Explicit, deliberate password reset for an attendee — the ONLY admin path
// that changes an attendee's password (profile edits never touch it). If
// new_password is omitted a random temp password is generated. The account is
// flagged must_reset_password = 1, so the attendee is walked through setting
// their own password on next login (the existing forced-reset flow). When
// notify is true and the attendee has an email on file, the temp password is
// emailed to them; the password is also returned so the admin can share it
// directly (e.g. over the phone).

import type { PagesContext } from '../../../../_shared/types.js';
import { createResponse, checkAdminAuth, handleCORS, hashPassword } from '../../../../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../../../_shared/errors.js';
import { generateTempPassword } from '../../../../_shared/temp-password.js';
import { isEmailReady, sendEmail } from '../../../../_shared/email.js';
import { escapeHtml } from '../../../../_shared/sanitize.js';

interface IdParams { id: string; }

const MIN_PASSWORD_LENGTH = 8;

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

export async function onRequestPost(context: PagesContext<IdParams>): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));

    const id = parseInt(context.params.id, 10);
    if (!id) return createErrorResponse(errors.badRequest('Attendee id required', requestId));

    const body = await context.request.json().catch(() => ({})) as { new_password?: string; notify?: boolean };

    let password: string;
    let generated = false;
    if (typeof body.new_password === 'string' && body.new_password.trim() !== '') {
      password = body.new_password.trim();
      if (password.length < MIN_PASSWORD_LENGTH) {
        return createErrorResponse(errors.badRequest(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`, requestId));
      }
    } else {
      password = generateTempPassword();
      generated = true;
    }

    const { results } = await context.env.DB.prepare(
      'SELECT id, name, email, ref_number FROM attendees WHERE id = ?'
    ).bind(id).all();
    if (!results.length) return createErrorResponse(errors.notFound('Attendee', requestId));
    const attendee = results[0] as { id: number; name: string; email: string | null; ref_number: string };

    const hash = await hashPassword(password);
    await context.env.DB.prepare(
      'UPDATE attendees SET password_hash = ?, must_reset_password = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(hash, id).run();

    // Optionally email the temp password to the attendee.
    let emailed = false;
    if (body.notify && attendee.email && isEmailReady(context.env)) {
      const retreatName = context.env.RETREAT_NAME || 'Growth and Wisdom Retreat';
      const portalUrl = context.env.PORTAL_URL || 'https://retreat.cloverleafchristiancentre.org';
      try {
        emailed = await sendEmail(context.env, {
          to: attendee.email,
          subject: `Your portal password has been reset — ${retreatName}`,
          html: buildResetHtml({ name: attendee.name, ref: attendee.ref_number, tempPassword: password, portalUrl, retreatName }),
        });
      } catch (err) {
        console.warn(`[${requestId}] reset email failed`, err);
      }
    }

    try {
      await context.env.DB.prepare(
        `INSERT INTO audit_log (admin_user, action, entity_type, entity_id, details)
         VALUES (?, 'attendee_password_reset', 'attendee', ?, ?)`
      ).bind(admin.user, id, JSON.stringify({ ref: attendee.ref_number, generated, emailed })).run();
    } catch (err) {
      console.warn(`[${requestId}] audit_log write failed`, err);
    }

    return createResponse({
      success: true,
      // Returned so the admin can copy/share it. The attendee must set their
      // own password on next login (must_reset_password = 1).
      temp_password: password,
      generated,
      emailed,
      message: `Password reset for ${attendee.name}. They'll set their own password on next login.`,
    });

  } catch (error) {
    console.error(`[${requestId}] attendee reset-password error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}

function buildResetHtml(o: { name: string; ref: string; tempPassword: string; portalUrl: string; retreatName: string }): string {
  return `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 560px; margin: 0 auto; background: #f8fafc; padding: 2rem;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 1.75rem; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0; font-size: 1.35rem;">Your password has been reset</h1>
        <p style="margin: 0.4rem 0 0 0; opacity: 0.9;">${escapeHtml(o.retreatName)}</p>
      </div>
      <div style="background: white; padding: 1.75rem; border-radius: 0 0 12px 12px;">
        <p style="color:#1f2937; margin:0 0 1rem;">Hi ${escapeHtml(o.name)},</p>
        <p style="color:#4b5563; margin:0 0 1rem; line-height:1.55;">Your retreat portal password has been reset. Sign in with the temporary password below — you'll be asked to choose your own password straight away.</p>
        <div style="background:#fef3c7; border:1px solid #fbbf24; padding:1rem 1.25rem; border-radius:8px; margin:1.25rem 0;">
          <table style="width:100%; border-collapse:collapse;">
            <tr><td style="padding:0.35rem 0; color:#6b7280; width:45%;">Reference number</td><td style="padding:0.35rem 0; font-family:monospace; font-weight:600; color:#1f2937;">${escapeHtml(o.ref)}</td></tr>
            <tr><td style="padding:0.35rem 0; color:#6b7280;">Temporary password</td><td style="padding:0.35rem 0; font-family:monospace; font-weight:600; color:#92400e;">${escapeHtml(o.tempPassword)}</td></tr>
          </table>
        </div>
        <div style="text-align:center; margin:1.5rem 0 0.5rem;">
          <a href="${escapeHtml(o.portalUrl)}" style="display:inline-block; background:linear-gradient(135deg,#667eea,#764ba2); color:white; padding:0.8rem 1.6rem; border-radius:8px; text-decoration:none; font-weight:600;">Open Portal</a>
        </div>
        <p style="color:#9ca3af; font-size:0.8rem; margin:1.25rem 0 0; text-align:center;">If you didn't expect this, contact the retreat team.</p>
      </div>
    </div>`;
}
