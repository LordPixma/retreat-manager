// POST /api/admin/allergy/send-forms
// Body:
//   attendee_id?: number   (single attendee — used for the per-row "Resend"
//                           button on the registry tab)
//   only_pending?: boolean (when no attendee_id, default true: only attendees
//                           who haven't responded yet)
//
// Distribution rule:
//   * Adult attendees (>= 16, or no DOB) → email goes to attendee.email.
//   * Child attendees (< 16) → email goes to the registration's primary email
//     (registrations.email looked up via attendees.registration_id).
//   * If the resolved recipient email is empty, the attendee is skipped and
//     listed in the response so the admin can follow up manually.

import type { PagesContext } from '../../../_shared/types.js';
import { createResponse, checkAdminAuth, handleCORS, generateAllergyFormToken } from '../../../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../../_shared/errors.js';
import { ageFromDateOfBirth } from '../../../_shared/names.js';
import { sendAllergyFormEmail, sendAllergyFormEmailsBatch } from '../../../_shared/notifications.js';
import type { AllergyFormBatchRecipient } from '../../../_shared/notifications.js';

interface AttendeeForAllergy {
  id: number;
  name: string;
  email: string | null;
  date_of_birth: string | null;
  registration_id: number | null;
  registration_email: string | null;
}

interface SkipReason {
  attendee_id: number;
  name: string;
  reason: string;
}

const CHILD_AGE_THRESHOLD = 16;

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

export async function onRequestPost(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));

    const body = await context.request.json().catch(() => ({})) as {
      attendee_id?: number;
      only_pending?: boolean;
    };

    const onlyPending = body.attendee_id ? false : (body.only_pending !== false);

    const filters: string[] = ['(a.is_archived = 0 OR a.is_archived IS NULL)'];
    const binds: (string | number)[] = [];

    if (body.attendee_id) {
      filters.push('a.id = ?');
      binds.push(body.attendee_id);
    } else if (onlyPending) {
      // Anyone without a row in allergy_records, or whose row is still 'pending'.
      filters.push("(ar.status IS NULL OR ar.status = 'pending')");
    }

    const stmt = `
      SELECT
        a.id, a.name, a.email, a.date_of_birth, a.registration_id,
        r.email AS registration_email
      FROM attendees a
      LEFT JOIN registrations r ON r.id = a.registration_id
      LEFT JOIN allergy_records ar ON ar.attendee_id = a.id
      WHERE ${filters.join(' AND ')}
      ORDER BY a.name
    `;

    const { results } = await context.env.DB.prepare(stmt).bind(...binds).all();
    const attendees = results as unknown as AttendeeForAllergy[];

    const portalUrl = (context.env.PORTAL_URL || 'https://retreat.cloverleafchristiancentre.org').replace(/\/$/, '');
    const secret = context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET;
    const sentTo: { attendee_id: number; recipient: string }[] = [];
    const skipped: SkipReason[] = [];

    // Phase 1: resolve recipient + mint token for every attendee with an
    // email. No HTTP subrequests in this loop — only HMAC signing, which is
    // hardware-accelerated and fast enough for hundreds of recipients.
    const batchRecipients: (AllergyFormBatchRecipient & { recipient: string })[] = [];
    for (const a of attendees) {
      const age = ageFromDateOfBirth(a.date_of_birth);
      const isChild = age !== null && age < CHILD_AGE_THRESHOLD;

      // Children: registration email if available; otherwise their own.
      // Adults: own email; fall back to registration email if missing.
      let recipient: string | null = null;
      let label: string | undefined;
      if (isChild) {
        recipient = a.registration_email || a.email;
        if (a.registration_email) label = 'the registrant';
      } else {
        recipient = a.email || a.registration_email;
      }

      if (!recipient) {
        skipped.push({ attendee_id: a.id, name: a.name, reason: 'no email available' });
        continue;
      }

      const token = await generateAllergyFormToken(a.id, secret);
      batchRecipients.push({
        attendee_id: a.id,
        attendee_name: a.name,
        recipient_email: recipient,
        recipient_label: label,
        form_url: `${portalUrl}/allergy?token=${encodeURIComponent(token)}`,
        recipient,
      });
    }

    // Phase 2: send. For a single attendee (per-row "Resend" button — a UI
    // label meaning "re-send") we use the single-recipient helper; for bulk
    // we fan out via sendEmailsBulk with bounded concurrency so a 73-person
    // blast doesn't all hit the Cloudflare Email Send binding at once.
    if (batchRecipients.length === 1) {
      const r = batchRecipients[0];
      const ok = await sendAllergyFormEmail(context.env, {
        attendee_name: r.attendee_name,
        recipient_email: r.recipient_email,
        recipient_label: r.recipient_label,
        form_url: r.form_url,
      });
      if (ok) {
        sentTo.push({ attendee_id: r.attendee_id, recipient: r.recipient });
      } else {
        skipped.push({ attendee_id: r.attendee_id, name: r.attendee_name, reason: 'email send failed (see worker logs)' });
      }
    } else if (batchRecipients.length > 1) {
      const batchResult = await sendAllergyFormEmailsBatch(context.env, batchRecipients);
      const sentSet = new Set(batchResult.sentAttendeeIds);
      for (const r of batchRecipients) {
        if (sentSet.has(r.attendee_id)) {
          sentTo.push({ attendee_id: r.attendee_id, recipient: r.recipient });
        } else {
          skipped.push({
            attendee_id: r.attendee_id,
            name: r.attendee_name,
            reason: batchResult.errorMessage || 'email send failed (see worker logs)',
          });
        }
      }
    }

    // Phase 3: one batched UPSERT into allergy_records for everyone we
    // successfully emailed — replaces N per-attendee subrequests with 1.
    // ON CONFLICT preserves any existing submission and only refreshes
    // form_sent_at + updated_at.
    if (sentTo.length > 0) {
      const sentIds = sentTo.map(s => s.attendee_id);
      const valuesClause = sentIds.map(() => "(?, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)").join(', ');
      try {
        await context.env.DB.prepare(`
          INSERT INTO allergy_records (attendee_id, status, form_sent_at, updated_at)
          VALUES ${valuesClause}
          ON CONFLICT(attendee_id) DO UPDATE SET
            form_sent_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        `).bind(...sentIds).run();
      } catch (err) {
        console.warn(`[${requestId}] allergy_records bulk upsert failed`, err);
      }
    }

    try {
      await context.env.DB.prepare(
        `INSERT INTO audit_log (admin_user, action, entity_type, entity_id, details)
         VALUES (?, 'send_allergy_forms', 'allergy', 0, ?)`
      ).bind(
        admin.user,
        JSON.stringify({ sent: sentTo.length, skipped: skipped.length, attendee_id: body.attendee_id || null })
      ).run();
    } catch (err) {
      console.warn(`[${requestId}] audit_log write failed`, err);
    }

    return createResponse({
      sent: sentTo.length,
      skipped: skipped.length,
      sent_to: sentTo,
      skipped_attendees: skipped,
    });
  } catch (error) {
    console.error(`[${requestId}] allergy send-forms error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
