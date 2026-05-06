// Bulk login-reminder email blast.
//
// Sends every active attendee a reminder to log into the portal. Behaviour
// splits on whether the attendee has ever logged in:
//
//   - last_login IS NULL  OR  must_reset_password = 1
//       => attendee never used the portal (or admin flagged them for reset).
//          We mint a fresh 12-char temp password, store its PBKDF2 hash, and
//          include the plaintext password in the email so they can log in.
//          must_reset_password is set to 1 so the portal forces a reset on
//          first login.
//
//   - last_login IS NOT NULL AND must_reset_password = 0
//       => attendee has logged in at some point, so they set their own
//          password. We can't recover that (PBKDF2 is one-way), so the email
//          just reminds them with their reference + email and tells them to
//          contact admin if they've forgotten the password they set.
//
// The endpoint is idempotent for already-logged-in users (no DB writes for
// them), but each call to this endpoint *does* rotate the temp password for
// every never-logged-in attendee — so re-running invalidates any temp
// password from a previous run. That's intentional: this is the "send people
// fresh credentials" button.

import type { PagesContext } from '../../../_shared/types.js';
import { createResponse, checkAdminAuth, handleCORS, hashPassword } from '../../../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../../_shared/errors.js';
import { escapeHtml } from '../../../_shared/sanitize.js';
import { sendEmailsBulk, type OutboundEmail } from '../../../_shared/email.js';

interface AttendeeRow {
  id: number;
  name: string;
  email: string;
  ref_number: string;
  last_login: string | null;
  must_reset_password: number | null;
}

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

// POST /api/admin/email/send-login-reminders
export async function onRequestPost(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));
    }
    if (!context.env.EMAIL || !context.env.FROM_EMAIL) {
      return createErrorResponse(errors.internal('Email system not configured', requestId));
    }

    const env = context.env;
    const portalUrl = env.PORTAL_URL || 'https://retreat.cloverleafchristiancentre.org';
    const retreatName = env.RETREAT_NAME || 'Growth and Wisdom Retreat';

    const { results } = await env.DB.prepare(`
      SELECT id, name, email, ref_number, last_login, must_reset_password
      FROM attendees
      WHERE email IS NOT NULL AND email != ''
        AND (is_archived = 0 OR is_archived IS NULL)
      ORDER BY name
    `).all();

    const rows = results as unknown as AttendeeRow[];
    if (rows.length === 0) {
      return createResponse({
        success: true,
        message: 'No attendees with email addresses to remind',
        sent: 0,
        total: 0,
        with_new_password: 0,
        existing_credentials: 0,
      });
    }

    // Phase 1: for never-logged-in / reset-flagged attendees, mint fresh temp
    // passwords and update the DB. We do this BEFORE sending email so the
    // password in the inbox matches the hash in the DB, even if the email
    // send fails for some recipients.
    interface Prepared {
      attendee: AttendeeRow;
      tempPassword: string | null; // null => existing credentials, just a reminder
    }
    const prepared: Prepared[] = [];
    const passwordResetUpdates: { id: number; hash: string }[] = [];

    for (const row of rows) {
      const needsNewPassword = row.last_login === null || row.must_reset_password === 1;
      if (needsNewPassword) {
        const tempPassword = generateTempPassword();
        const hash = await hashPassword(tempPassword);
        passwordResetUpdates.push({ id: row.id, hash });
        prepared.push({ attendee: row, tempPassword });
      } else {
        prepared.push({ attendee: row, tempPassword: null });
      }
    }

    // Single D1 batch — one subrequest regardless of how many rows we update.
    if (passwordResetUpdates.length > 0) {
      const updateStmt = env.DB.prepare(`
        UPDATE attendees
        SET password_hash = ?, must_reset_password = 1, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      try {
        await env.DB.batch(passwordResetUpdates.map(u => updateStmt.bind(u.hash, u.id)));
      } catch (err) {
        console.error(`[${requestId}] Password rotation batch failed`, err);
        return createErrorResponse(errors.internal('Failed to rotate temp passwords', requestId));
      }
    }

    // Phase 2: build the per-recipient emails and fan out via the shared bulk
    // helper. Each attendee gets a unique payload (their own ref_number /
    // temp_password where applicable), so this is a true per-recipient blast,
    // not a single broadcast.
    const messages: OutboundEmail[] = prepared.map(p => ({
      to: p.attendee.email,
      subject: `Sign in to your portal — ${retreatName}`,
      html: buildLoginReminderHtml({
        attendee: p.attendee,
        tempPassword: p.tempPassword,
        portalUrl,
        retreatName,
        adminEmail: env.ADMIN_NOTIFICATION_EMAIL || env.FROM_EMAIL || '',
      }),
    }));
    const keys = prepared.map(p => p.attendee.id);

    const result = await sendEmailsBulk(env, messages, keys);
    const sent = result.sentKeys.length;
    const failed = result.failedKeys.length;

    try {
      await env.DB.prepare(
        `INSERT INTO audit_log (admin_user, action, entity_type, entity_id, details)
         VALUES (?, 'send_login_reminders', 'system', 0, ?)`
      ).bind(
        admin.user || 'Admin',
        JSON.stringify({
          sent,
          failed,
          total: rows.length,
          with_new_password: passwordResetUpdates.length,
          existing_credentials: rows.length - passwordResetUpdates.length,
        }),
      ).run();
    } catch (err) {
      console.warn(`[${requestId}] audit_log write failed`, err);
    }

    return createResponse({
      success: true,
      message: `Sent ${sent} login reminders (${passwordResetUpdates.length} with new temp passwords)`,
      sent,
      failed,
      total: rows.length,
      with_new_password: passwordResetUpdates.length,
      existing_credentials: rows.length - passwordResetUpdates.length,
      errors: result.errorMessage ? [result.errorMessage] : [],
    });

  } catch (error) {
    console.error(`[${requestId}] Login-reminder error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}

// Cryptographically random 12-char temp password (matches the generator used
// by the registration-approval flow so attendees see consistent password
// shapes across the lifecycle).
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const len = 12;
  const buf = crypto.getRandomValues(new Uint32Array(len));
  let password = '';
  for (let i = 0; i < len; i++) {
    password += chars.charAt(buf[i] % chars.length);
  }
  return password;
}

function buildLoginReminderHtml(opts: {
  attendee: AttendeeRow;
  tempPassword: string | null;
  portalUrl: string;
  retreatName: string;
  adminEmail: string;
}): string {
  const { attendee, tempPassword, portalUrl, retreatName, adminEmail } = opts;

  const credentialsBlock = tempPassword
    ? `
        <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 1rem 1.25rem; border-radius: 8px; margin: 1.5rem 0;">
          <strong style="color: #92400e; display: block; margin-bottom: 0.5rem;">Your login credentials</strong>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 0.4rem 0; color: #6b7280; width: 40%;">Reference number</td>
              <td style="padding: 0.4rem 0; font-family: monospace; color: #1f2937; font-weight: 600;">${escapeHtml(attendee.ref_number)}</td>
            </tr>
            <tr>
              <td style="padding: 0.4rem 0; color: #6b7280;">Temporary password</td>
              <td style="padding: 0.4rem 0; font-family: monospace; color: #92400e; font-weight: 600;">${escapeHtml(tempPassword)}</td>
            </tr>
          </table>
          <p style="color: #b45309; font-size: 0.85rem; margin: 0.75rem 0 0 0;">
            You'll be asked to set your own password the first time you log in.
          </p>
        </div>
      `
    : `
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 1rem 1.25rem; border-radius: 8px; margin: 1.5rem 0;">
          <strong style="color: #1e3a8a; display: block; margin-bottom: 0.5rem;">Your account</strong>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 0.4rem 0; color: #6b7280; width: 40%;">Reference number</td>
              <td style="padding: 0.4rem 0; font-family: monospace; color: #1f2937; font-weight: 600;">${escapeHtml(attendee.ref_number)}</td>
            </tr>
            <tr>
              <td style="padding: 0.4rem 0; color: #6b7280;">Email on file</td>
              <td style="padding: 0.4rem 0; color: #1f2937;">${escapeHtml(attendee.email)}</td>
            </tr>
          </table>
          <p style="color: #1e40af; font-size: 0.9rem; margin: 0.75rem 0 0 0;">
            Sign in with the password you set the last time you logged in.${
              adminEmail
                ? ` If you've forgotten it, reply to this email or contact <a href="mailto:${escapeHtml(adminEmail)}" style="color: #1d4ed8;">${escapeHtml(adminEmail)}</a> and we'll reset it.`
                : ''
            }
          </p>
        </div>
      `;

  return `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 620px; margin: 0 auto; background: #f8fafc; padding: 2rem;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0; font-size: 1.5rem;">Please sign in to your retreat portal</h1>
        <p style="margin: 0.5rem 0 0 0; opacity: 0.9;">${escapeHtml(retreatName)}</p>
      </div>
      <div style="background: white; padding: 2rem; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.08);">
        <p style="font-size: 1rem; color: #1f2937; margin: 0 0 1rem 0;">
          Hi ${escapeHtml(attendee.name)},
        </p>
        <p style="color: #4b5563; margin: 0 0 1rem 0; line-height: 1.55;">
          ${tempPassword
            ? `We've prepared a fresh login for your retreat portal account so you can review and update your details ahead of the retreat.`
            : `Just a quick reminder to sign in to your retreat portal account and review your details ahead of the retreat.`
          }
        </p>

        ${credentialsBlock}

        <div style="text-align: center; margin: 1.75rem 0 1rem 0;">
          <a href="${escapeHtml(portalUrl)}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 0.85rem 1.75rem; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Open Portal
          </a>
        </div>
        <p style="color: #6b7280; font-size: 0.85rem; margin: 1rem 0 0 0;">
          If the button doesn't work, paste this link into your browser:<br>
          <span style="word-break: break-all;">${escapeHtml(portalUrl)}</span>
        </p>
        <p style="color: #9ca3af; font-size: 0.8rem; margin: 1.5rem 0 0 0; text-align: center;">
          ${escapeHtml(retreatName)} Team
        </p>
      </div>
    </div>
  `;
}

