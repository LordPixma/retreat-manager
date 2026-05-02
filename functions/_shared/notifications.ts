// Outbound notification helpers shared by admin endpoints.
// Each function is a no-op when the recipient has no email or when the
// Resend env vars aren't set, so callers can fire-and-forget without guards.

import type { Env } from './types.js';
import { escapeHtml } from './sanitize.js';

interface RoomAssignmentRecipient {
  name: string;
  email: string | null;
  ref_number: string;
}

interface RoomDetails {
  number: string;
  description: string | null;
  floor?: string | null;
}

/**
 * Send a room-assignment notification to one attendee.
 * Returns true if the email was queued with Resend, false if skipped or failed.
 */
export async function sendRoomAssignedEmail(
  env: Env,
  attendee: RoomAssignmentRecipient,
  room: RoomDetails,
  groupName: string | null = null,
): Promise<boolean> {
  if (!attendee.email) return false;
  if (!env.RESEND_API_KEY || !env.FROM_EMAIL) {
    console.warn('[notifications] room-assigned email skipped — Resend not configured');
    return false;
  }

  const retreatName = env.RETREAT_NAME || 'Growth and Wisdom Retreat';
  const portalUrl = env.PORTAL_URL || 'https://retreat.cloverleafchristiancentre.org';

  const html = `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 2rem;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0; font-size: 1.6rem;">Your Room Has Been Assigned</h1>
        <p style="margin: 0.5rem 0 0 0; opacity: 0.9;">${escapeHtml(retreatName)}</p>
      </div>
      <div style="background: white; padding: 2rem; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <p style="font-size: 1rem; color: #1f2937; margin: 0 0 1rem 0;">
          Hello ${escapeHtml(attendee.name)},
        </p>
        <p style="color: #4b5563; margin: 0 0 1.5rem 0;">
          Good news — your room for the retreat has been assigned. Details below.
        </p>
        <table style="width: 100%; border-collapse: collapse; margin: 1.5rem 0;">
          <tr>
            <td style="padding: 0.75rem 1rem; background: #f3f4f6; color: #6b7280; width: 40%;">Room</td>
            <td style="padding: 0.75rem 1rem; background: #f9fafb; color: #1f2937; font-weight: 600;">${escapeHtml(room.number)}</td>
          </tr>
          ${room.description ? `
          <tr>
            <td style="padding: 0.75rem 1rem; background: #f3f4f6; color: #6b7280;">Description</td>
            <td style="padding: 0.75rem 1rem; background: #f9fafb; color: #1f2937;">${escapeHtml(room.description)}</td>
          </tr>
          ` : ''}
          ${room.floor ? `
          <tr>
            <td style="padding: 0.75rem 1rem; background: #f3f4f6; color: #6b7280;">Floor</td>
            <td style="padding: 0.75rem 1rem; background: #f9fafb; color: #1f2937;">${escapeHtml(room.floor)}</td>
          </tr>
          ` : ''}
          ${groupName ? `
          <tr>
            <td style="padding: 0.75rem 1rem; background: #f3f4f6; color: #6b7280;">Group</td>
            <td style="padding: 0.75rem 1rem; background: #f9fafb; color: #1f2937;">${escapeHtml(groupName)}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 0.75rem 1rem; background: #f3f4f6; color: #6b7280;">Reference</td>
            <td style="padding: 0.75rem 1rem; background: #f9fafb; color: #1f2937; font-family: monospace;">${escapeHtml(attendee.ref_number)}</td>
          </tr>
        </table>
        <div style="text-align: center; margin: 2rem 0 1rem;">
          <a href="${escapeHtml(portalUrl)}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 0.85rem 1.75rem; border-radius: 8px; text-decoration: none; font-weight: 600;">
            View in Portal
          </a>
        </div>
        <p style="color: #6b7280; font-size: 0.85rem; margin: 1.5rem 0 0 0;">
          If your assignment changes again, we'll send a follow-up email. Reply to this message if anything looks wrong.
        </p>
      </div>
    </div>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.FROM_EMAIL,
        to: [attendee.email],
        // Strip CR/LF defensively in case admin-provided room number sneaks newlines.
        subject: `Your room assignment — ${retreatName}`.replace(/[\r\n]/g, ' '),
        html,
      }),
    });
    if (!response.ok) {
      const body = await response.text();
      console.error('[notifications] Resend rejected room-assigned email', response.status, body);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[notifications] room-assigned email failed', err);
    return false;
  }
}

interface AllergyFormRecipient {
  attendee_name: string;
  recipient_email: string;
  recipient_label?: string; // e.g. "the registrant" if it's the parent for a child
  form_url: string;
}

function buildAllergyFormSubject(attendeeName: string, retreatName: string): string {
  // Strip CR/LF defensively so a manipulated attendee name can't inject SMTP headers.
  return `Allergy / medical form for ${attendeeName.replace(/[\r\n]/g, ' ')} — ${retreatName}`;
}

function buildAllergyFormHtml(retreatName: string, opts: AllergyFormRecipient): string {
  const audienceLine = opts.recipient_label
    ? `You're receiving this because you registered <strong>${escapeHtml(opts.attendee_name)}</strong> for the retreat.`
    : `Please confirm your allergy / medical information for the retreat.`;
  return `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 2rem;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0; font-size: 1.5rem;">Allergy &amp; Medical Form</h1>
        <p style="margin: 0.5rem 0 0 0; opacity: 0.9;">${escapeHtml(retreatName)}</p>
      </div>
      <div style="background: white; padding: 2rem; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); color: #1f2937;">
        <p style="font-size: 1rem; margin: 0 0 1rem 0;">${audienceLine}</p>
        <p style="color: #4b5563; margin: 0 0 1.5rem 0;">
          Please complete a quick form so our team can keep <strong>${escapeHtml(opts.attendee_name)}</strong> safe at the retreat.
          It takes under a minute and you can update it later if anything changes.
        </p>
        <div style="text-align: center; margin: 2rem 0;">
          <a href="${escapeHtml(opts.form_url)}"
             style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 0.85rem 1.75rem; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Open Allergy Form
          </a>
        </div>
        <p style="color: #6b7280; font-size: 0.85rem; margin: 1.5rem 0 0 0;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <span style="word-break: break-all;">${escapeHtml(opts.form_url)}</span>
        </p>
        <p style="color: #6b7280; font-size: 0.8rem; margin: 1.5rem 0 0 0;">
          This link is private to ${escapeHtml(opts.attendee_name)} and expires in 30 days.
        </p>
      </div>
    </div>
  `;
}

/**
 * Send the allergy / medical form invitation email to ONE recipient. Used by
 * the per-row "Resend" button on the Allergy Registry tab. For bulk sends,
 * use sendAllergyFormEmailsBatch instead — that routes through Resend's
 * /emails/batch endpoint to stay under Cloudflare Workers' subrequest budget.
 */
export async function sendAllergyFormEmail(env: Env, opts: AllergyFormRecipient): Promise<boolean> {
  if (!opts.recipient_email || !env.RESEND_API_KEY || !env.FROM_EMAIL) return false;

  const retreatName = env.RETREAT_NAME || 'Growth and Wisdom Retreat';
  const html = buildAllergyFormHtml(retreatName, opts);

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.FROM_EMAIL,
        to: [opts.recipient_email],
        subject: buildAllergyFormSubject(opts.attendee_name, retreatName),
        html,
      }),
    });
    if (!response.ok) {
      console.error('[notifications] Resend rejected allergy email', response.status, await response.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error('[notifications] allergy email failed', err);
    return false;
  }
}

export interface AllergyFormBatchRecipient extends AllergyFormRecipient {
  attendee_id: number;
}

export interface AllergyFormBatchResult {
  sentAttendeeIds: number[];
  failedAttendeeIds: number[];
  errorMessage: string | null;
}

/**
 * Send allergy-form emails in bulk via Resend's /emails/batch endpoint.
 *
 * Each recipient still gets a unique tokenised URL (Resend accepts a per-
 * message `to`/`html`), but we collapse N HTTP requests into ceil(N/100) so
 * the bulk sender stays under Cloudflare Workers' free-tier subrequest cap.
 *
 * Resend's batch endpoint either accepts the whole sub-batch or rejects it;
 * partial failures inside one batch surface as a non-2xx on the whole call.
 * That's the trade-off we accept for the launch use case (send to all).
 */
export async function sendAllergyFormEmailsBatch(
  env: Env,
  recipients: AllergyFormBatchRecipient[],
): Promise<AllergyFormBatchResult> {
  if (recipients.length === 0) {
    return { sentAttendeeIds: [], failedAttendeeIds: [], errorMessage: null };
  }
  if (!env.RESEND_API_KEY || !env.FROM_EMAIL) {
    return {
      sentAttendeeIds: [],
      failedAttendeeIds: recipients.map(r => r.attendee_id),
      errorMessage: 'Resend not configured (RESEND_API_KEY / FROM_EMAIL missing)',
    };
  }

  const retreatName = env.RETREAT_NAME || 'Growth and Wisdom Retreat';
  const RESEND_BATCH_MAX = 100;
  const sent: number[] = [];
  const failed: number[] = [];
  let lastError: string | null = null;

  for (let i = 0; i < recipients.length; i += RESEND_BATCH_MAX) {
    const slice = recipients.slice(i, i + RESEND_BATCH_MAX);
    const payload = slice.map(r => ({
      from: env.FROM_EMAIL,
      to: [r.recipient_email],
      subject: buildAllergyFormSubject(r.attendee_name, retreatName),
      html: buildAllergyFormHtml(retreatName, r),
    }));

    try {
      const response = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        sent.push(...slice.map(r => r.attendee_id));
      } else {
        lastError = `${response.status}: ${await response.text()}`;
        failed.push(...slice.map(r => r.attendee_id));
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      failed.push(...slice.map(r => r.attendee_id));
    }
  }

  return { sentAttendeeIds: sent, failedAttendeeIds: failed, errorMessage: lastError };
}
