// Admin registration detail endpoint
// View, approve, reject, or delete individual registrations

import type { PagesContext, Env } from '../../../_shared/types.js';
import { createResponse, checkAdminAuth, handleCORS, hashPassword } from '../../../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../../_shared/errors.js';
import { splitFullName } from '../../../_shared/names.js';
import { escapeHtml } from '../../../_shared/sanitize.js';
import { sendEmailOrThrow, isEmailReady } from '../../../_shared/email.js';

interface IdParams {
  id: string;
}

interface RegistrationRow {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  emergency_contact: string | null;
  dietary_requirements: string | null;
  special_requests: string | null;
  preferred_room_type: string;
  payment_option: string;
  status: string;
  notes: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  family_members: string | null;
  total_amount: number | null;
  member_count: number | null;
}

interface FamilyMember {
  name: string;
  date_of_birth: string;
  dietary_requirements?: string;
  special_needs?: string;
  member_type: 'adult' | 'child' | 'infant';
  price: number;
}

interface ApprovalInput {
  action: 'approve' | 'reject' | 'waitlist' | 'reissue';
  notes?: string;
  room_id?: number;
  group_id?: number;
}

interface CreatedAttendee {
  name: string;
  ref_number: string;
  temp_password: string;
  member_type: string;
  payment_due: number;
}

// Handle CORS preflight
export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

// GET /api/admin/registrations/:id - Get single registration
export async function onRequestGet(context: PagesContext<IdParams>): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));
    }

    const registrationId = context.params.id;
    if (!registrationId) {
      return createErrorResponse(errors.badRequest('Registration ID is required', requestId));
    }

    const { results } = await context.env.DB.prepare(`
      SELECT * FROM registrations WHERE id = ?
    `).bind(registrationId).all();

    if (results.length === 0) {
      return createErrorResponse(errors.notFound('Registration', requestId));
    }

    return createResponse(results[0] as unknown as RegistrationRow);

  } catch (error) {
    console.error(`[${requestId}] Error fetching registration:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}

// PUT /api/admin/registrations/:id - Approve, reject, or update registration
export async function onRequestPut(context: PagesContext<IdParams>): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));
    }

    const registrationId = context.params.id;
    if (!registrationId) {
      return createErrorResponse(errors.badRequest('Registration ID is required', requestId));
    }

    // Get registration with all fields
    const { results } = await context.env.DB.prepare(`
      SELECT * FROM registrations WHERE id = ?
    `).bind(registrationId).all();

    if (results.length === 0) {
      return createErrorResponse(errors.notFound('Registration', requestId));
    }

    const registration = results[0] as unknown as RegistrationRow;
    const body = await context.request.json() as ApprovalInput;

    if (!body.action || !['approve', 'reject', 'waitlist', 'reissue'].includes(body.action)) {
      return createErrorResponse(errors.badRequest('Valid action is required (approve, reject, waitlist, reissue)', requestId));
    }

    if (body.action === 'approve') {
      console.log(`[${requestId}] APPROVE start: reg_id=${registration.id} status=${registration.status} email=${registration.email} has_family_members=${!!registration.family_members} member_count=${registration.member_count}`);

      // Has a previous approval already created accounts for this registration?
      // Approval used to insert the attendee rows and flip the registration
      // status as separate writes. If the request died in between — a
      // ref_number race on a later family member, a worker timeout, a hung
      // email — some attendee rows committed while the registration stayed
      // 'pending'. The registration then kept showing an "Approve" button, and
      // every retry re-ran the INSERTs straight into the UNIQUE(ref_number) /
      // UNIQUE(email) constraints, surfacing as the confusing 409 "Resource
      // already exists" the admin sees.
      const existingForReg = await context.env.DB.prepare(
        `SELECT COUNT(*) AS n FROM attendees WHERE registration_id = ? AND (is_archived = 0 OR is_archived IS NULL)`
      ).bind(registration.id).first<{ n: number }>();
      const existingCount = existingForReg?.n ?? 0;
      console.log(`[${requestId}] APPROVE guard: existing active attendees for reg_id=${registration.id} -> ${existingCount}`);

      if (existingCount > 0) {
        if (registration.status === 'approved') {
          // Genuinely already approved (double-click or a stale tab). Leave the
          // existing credentials untouched and steer the admin to Re-issue.
          console.warn(`[${requestId}] APPROVE blocked: reg already approved with ${existingCount} attendee(s)`);
          return createErrorResponse(errors.conflict(
            `This registration is already approved and has ${existingCount} attendee account(s). ` +
            `Use "Re-issue credentials" if the family needs their login details resent.`,
            requestId
          ));
        }

        // Accounts exist but the registration never reached 'approved' — an
        // interrupted approval. Resume it: reset those accounts to fresh
        // credentials, mark the registration approved and email, all in one
        // atomic batch so it cannot wedge again. (The original temp passwords
        // are hashed and unrecoverable, and the family never received working
        // credentials, so re-issuing is the correct recovery.)
        console.warn(`[${requestId}] APPROVE resume: reg_id=${registration.id} has ${existingCount} orphaned attendee(s), status=${registration.status} — reconciling`);

        const { statements, reissued } = await buildCredentialResetBatch(context.env.DB, registration);
        statements.push(
          context.env.DB.prepare(`
            UPDATE registrations
            SET status = 'approved', notes = ?, reviewed_at = CURRENT_TIMESTAMP, reviewed_by = ?
            WHERE id = ?
          `).bind(body.notes || null, admin.user || 'Admin', registrationId)
        );
        await context.env.DB.batch(statements);

        await writeAuditLog(context.env.DB, admin.user || 'Admin', 'approve_resume', registrationId, {
          accounts_recovered: reissued.length,
          primary_email: registration.email
        }, requestId);

        const { emailSent, emailError } = await trySendApprovalEmail(context.env, registration, reissued, requestId);
        console.log(`[${requestId}] APPROVE resume success: reg_id=${registration.id} accounts=${reissued.length} email_sent=${emailSent}`);

        const expected = registration.member_count || reissued.length;
        const shortfall = reissued.length < expected
          ? ` Note: this registration lists ${expected} member(s) but only ${reissued.length} account(s) were found — please verify the family is complete.`
          : '';

        return createResponse({
          success: true,
          message: (emailSent
            ? `A previous approval for this registration was interrupted. Recovered its ${reissued.length} existing account(s) with fresh credentials and emailed them to ${registration.email}.`
            : `A previous approval for this registration was interrupted. Recovered its ${reissued.length} existing account(s) with fresh credentials, but email delivery to ${registration.email} FAILED — please copy them manually.`) + shortfall,
          email_sent: emailSent,
          email_error: emailError,
          attendees: reissued
        });
      }

      // No accounts yet — a normal first-time approval. The primary attendee
      // carries the registration email, which is UNIQUE across attendees. If
      // that email is already taken by an account from a different registration
      // (same person registered twice, or a hand-created account), the INSERT
      // would fail the same way — catch it with a precise message rather than a
      // generic conflict.
      if (registration.email) {
        const emailTaken = await context.env.DB.prepare(
          `SELECT id, ref_number, registration_id FROM attendees WHERE email = ? LIMIT 1`
        ).bind(registration.email).first<{ id: number; ref_number: string; registration_id: number | null }>();
        if (emailTaken) {
          console.warn(`[${requestId}] APPROVE blocked: email ${registration.email} already used by attendee id=${emailTaken.id} ref=${emailTaken.ref_number} reg=${emailTaken.registration_id}`);
          return createErrorResponse(errors.conflict(
            `An attendee account already uses the email ${registration.email}. ` +
            `Approval aborted to avoid creating a duplicate account.`,
            requestId
          ));
        }
      }

      // Parse family members from registration
      let familyMembers: FamilyMember[] = [];
      try {
        if (registration.family_members) {
          familyMembers = JSON.parse(registration.family_members);
        }
      } catch (e) {
        console.warn(`[${requestId}] Failed to parse family members, using primary contact only`);
      }

      // If no family members parsed, create one from registration data
      if (familyMembers.length === 0) {
        familyMembers = [{
          name: registration.name,
          date_of_birth: '',
          member_type: 'adult',
          price: registration.total_amount || 200
        }];
      }

      console.log(`[${requestId}] APPROVE creating ${familyMembers.length} attendee(s): ${familyMembers.map(m => m.name).join(', ')} | room_id=${body.room_id || null} group_id=${body.group_id || null}`);

      // Create every attendee AND mark the registration approved as a single
      // atomic batch (see approveWithNewAttendees). An all-or-nothing commit is
      // what stops a partial failure from stranding orphan accounts behind a
      // still-'pending' registration ever again.
      const createdAttendees = await approveWithNewAttendees(
        context.env.DB,
        registration,
        familyMembers,
        body.room_id || null,
        body.group_id || null,
        admin.user || 'Admin',
        body.notes || null,
        requestId
      );

      await writeAuditLog(context.env.DB, admin.user || 'Admin', 'approve', registrationId, {
        attendees_created: createdAttendees.length,
        primary_email: registration.email
      }, requestId);

      // Send approval email with all credentials. We report delivery back to
      // the admin (rather than claiming success blindly) so the UI never says
      // "Credentials sent to X" when the email transport actually failed.
      const { emailSent, emailError } = await trySendApprovalEmail(context.env, registration, createdAttendees, requestId);
      console.log(`[${requestId}] APPROVE success: reg_id=${registration.id} created=${createdAttendees.length} refs=[${createdAttendees.map(a => a.ref_number).join(', ')}] email_sent=${emailSent}`);

      const message = emailSent
        ? `Registration approved! Created ${createdAttendees.length} attendee account(s). Credentials sent to ${registration.email}`
        : `Registration approved (${createdAttendees.length} attendee(s) created). Email delivery to ${registration.email} FAILED — please copy credentials manually.`;

      return createResponse({
        success: true,
        message,
        email_sent: emailSent,
        email_error: emailError,
        attendees: createdAttendees
      });

    } else if (body.action === 'reissue') {
      // Re-issue credentials for a registration whose attendee accounts already
      // exist (e.g. an approved family that lost their welcome email). This
      // resets each linked attendee to a fresh temp password and re-sends the
      // credentials email — no new accounts are created, so it sidesteps the
      // UNIQUE collisions that block a second 'approve'.
      console.log(`[${requestId}] REISSUE start: reg_id=${registration.id} status=${registration.status} email=${registration.email}`);

      const { statements, reissued } = await buildCredentialResetBatch(context.env.DB, registration);

      if (reissued.length === 0) {
        console.warn(`[${requestId}] REISSUE blocked: no active attendees linked to reg_id=${registration.id}`);
        return createErrorResponse(errors.badRequest(
          'No active attendee accounts are linked to this registration, so there are no credentials to re-issue. ' +
          'Approve the registration first (or its accounts may have been deleted).',
          requestId
        ));
      }

      // One atomic batch so a partial reset can't leave some of the family on
      // old passwords and some on new ones.
      await context.env.DB.batch(statements);
      console.log(`[${requestId}] REISSUE reset ${reissued.length} password(s) for reg_id=${registration.id}`);

      await writeAuditLog(context.env.DB, admin.user || 'Admin', 'reissue_credentials', registrationId, {
        accounts: reissued.length,
        primary_email: registration.email
      }, requestId);

      const { emailSent, emailError } = await trySendApprovalEmail(context.env, registration, reissued, requestId);
      console.log(`[${requestId}] REISSUE success: reg_id=${registration.id} accounts=${reissued.length} email_sent=${emailSent}`);

      return createResponse({
        success: true,
        message: emailSent
          ? `Credentials re-issued for ${reissued.length} account(s) and emailed to ${registration.email}.`
          : `Credentials re-issued for ${reissued.length} account(s), but email delivery to ${registration.email} FAILED — please copy them manually.`,
        email_sent: emailSent,
        email_error: emailError,
        attendees: reissued
      });

    } else {
      // Reject or waitlist
      const newStatus = body.action === 'reject' ? 'rejected' : 'waitlist';

      await context.env.DB.prepare(`
        UPDATE registrations
        SET status = ?, notes = ?, reviewed_at = CURRENT_TIMESTAMP, reviewed_by = ?
        WHERE id = ?
      `).bind(newStatus, body.notes || null, admin.user || 'Admin', registrationId).run();

      return createResponse({
        success: true,
        message: `Registration ${newStatus === 'rejected' ? 'rejected' : 'added to waitlist'}`
      });
    }

  } catch (error) {
    console.error(`[${requestId}] Error updating registration:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}

// DELETE /api/admin/registrations/:id - Delete registration
export async function onRequestDelete(context: PagesContext<IdParams>): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));
    }

    const registrationId = context.params.id;
    if (!registrationId) {
      return createErrorResponse(errors.badRequest('Registration ID is required', requestId));
    }

    const result = await context.env.DB.prepare(`
      DELETE FROM registrations WHERE id = ?
    `).bind(registrationId).run();

    if (!result.success || result.meta.changes === 0) {
      return createErrorResponse(errors.notFound('Registration', requestId));
    }

    return createResponse({
      success: true,
      message: 'Registration deleted successfully'
    });

  } catch (error) {
    console.error(`[${requestId}] Error deleting registration:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}

// Helper: read the current highest REF<YY>#### suffix for this year. Callers
// add their own per-row and per-retry offsets to allocate fresh numbers; the
// INSERT batch is what actually claims them, so concurrent approvals reconcile
// by retrying the batch from a freshly-read (and therefore higher) base.
async function nextRefNumberBase(db: D1Database): Promise<number> {
  const prefix = 'REF';
  const year = new Date().getFullYear().toString().slice(-2);

  const { results } = await db.prepare(`
    SELECT ref_number FROM attendees
    WHERE ref_number LIKE ?
    ORDER BY ref_number DESC
    LIMIT 1
  `).bind(`${prefix}${year}%`).all();

  if (results.length > 0) {
    const lastRef = (results[0] as unknown as { ref_number: string }).ref_number;
    const numPart = parseInt(lastRef.slice(5), 10);
    if (!isNaN(numPart)) return numPart;
  }
  return 0;
}

// Helper: approve a registration that has NO attendee accounts yet. Inserts a
// row for every family member AND flips the registration to 'approved' as one
// atomic D1 batch (a single implicit transaction). Because the inserts and the
// status update commit together, an interrupted or failed approval can no
// longer leave orphaned attendee rows behind a still-'pending' registration —
// the exact state that used to wedge re-approval behind a UNIQUE-constraint 409.
async function approveWithNewAttendees(
  db: D1Database,
  registration: RegistrationRow,
  familyMembers: FamilyMember[],
  roomId: number | null,
  groupId: number | null,
  adminUser: string,
  notes: string | null,
  requestId: string
): Promise<CreatedAttendee[]> {
  // Hash every temp password up front so a ref-number retry doesn't redo the
  // (expensive) hashing or change the password the family will be emailed.
  const plans = await Promise.all(familyMembers.map(async (member, i) => {
    const tempPassword = generateTempPassword();
    return {
      member,
      isPrimary: i === 0, // first member is primary — gets email and phone
      tempPassword,
      passwordHash: await hashPassword(tempPassword),
    };
  }));

  const year = new Date().getFullYear().toString().slice(-2);
  const MAX_ATTEMPTS = 5;
  let lastError: unknown = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const base = await nextRefNumberBase(db);
    const created: CreatedAttendee[] = [];
    const statements: D1PreparedStatement[] = [];

    plans.forEach((plan, idx) => {
      // Space refs within the batch (idx) and bump them every retry (attempt)
      // so a concurrent approval that grabbed the same MAX stops colliding.
      const num = base + 1 + idx + attempt;
      const refNumber = `REF${year}${num.toString().padStart(4, '0')}`;
      const memberName = plan.member.name.trim();
      const { first: firstName, last: lastName } = splitFullName(memberName);

      statements.push(
        db.prepare(`
          INSERT INTO attendees (
            ref_number, name, first_name, last_name, date_of_birth,
            email, password_hash, phone,
            emergency_contact, dietary_requirements, special_requests,
            room_id, group_id, payment_due, payment_status, payment_option,
            registration_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
        `).bind(
          refNumber,
          memberName,
          firstName,
          lastName,
          plan.member.date_of_birth?.trim() || null,
          plan.isPrimary ? registration.email : null, // Only primary gets email
          plan.passwordHash,
          plan.isPrimary ? registration.phone : null, // Only primary gets phone
          plan.isPrimary ? registration.emergency_contact : null,
          plan.member.dietary_requirements || plan.member.special_needs || null,
          plan.isPrimary ? registration.special_requests : null,
          roomId,
          groupId,
          plan.member.price || 0,
          registration.payment_option || 'full',
          registration.id
        )
      );

      created.push({
        name: plan.member.name,
        ref_number: refNumber,
        temp_password: plan.tempPassword,
        member_type: plan.member.member_type,
        payment_due: plan.member.price || 0,
      });
    });

    // Same transaction: mark the registration approved. All-or-nothing.
    statements.push(
      db.prepare(`
        UPDATE registrations
        SET status = 'approved', notes = ?, reviewed_at = CURRENT_TIMESTAMP, reviewed_by = ?
        WHERE id = ?
      `).bind(notes, adminUser, registration.id)
    );

    try {
      await db.batch(statements);
      console.log(`[${requestId}] APPROVE batch committed ${created.length} attendee(s) atomically: refs=[${created.map(a => a.ref_number).join(', ')}]`);
      return created;
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[${requestId}] APPROVE batch failed (attempt ${attempt + 1}/${MAX_ATTEMPTS}): ${msg}`);
      // A ref_number race is the only failure a retry can fix (bump the number).
      // Any other UNIQUE collision — notably the primary email — won't resolve
      // by retrying, so rethrow immediately for the caller's error handling.
      if (msg.includes('ref_number') && attempt < MAX_ATTEMPTS - 1) continue;
      throw err;
    }
  }

  // Exhausted retries on ref_number races.
  throw lastError instanceof Error
    ? lastError
    : new Error('Failed to allocate a unique reference number after multiple attempts');
}

// Helper: build the password-reset statements for every active attendee linked
// to a registration, plus the credential metadata to email. Shared by the
// 'reissue' action and the approve-resume path (an interrupted approval whose
// accounts already exist). The caller runs the statements in one atomic batch —
// optionally alongside a status update — so a partial reset can't strand the
// family again. Rows are ordered primary-first (email-bearing) to match the
// approval email layout.
async function buildCredentialResetBatch(
  db: D1Database,
  registration: RegistrationRow
): Promise<{ statements: D1PreparedStatement[]; reissued: CreatedAttendee[] }> {
  const { results: attendeeRows } = await db.prepare(`
    SELECT id, ref_number, name, email, payment_due
    FROM attendees
    WHERE registration_id = ? AND (is_archived = 0 OR is_archived IS NULL)
    ORDER BY (email IS NULL), id
  `).bind(registration.id).all();

  // member_type isn't stored on the attendee row — recover it from the
  // registration's family_members JSON for the email's per-person label.
  let familyForTypes: FamilyMember[] = [];
  try {
    if (registration.family_members) familyForTypes = JSON.parse(registration.family_members);
  } catch {
    // non-fatal — labels just fall back to 'adult'
  }
  const typeByName = new Map(
    familyForTypes.map(m => [m.name.trim().toLowerCase(), m.member_type])
  );

  const statements: D1PreparedStatement[] = [];
  const reissued: CreatedAttendee[] = [];
  for (const row of attendeeRows as unknown as Array<{ id: number; ref_number: string; name: string; email: string | null; payment_due: number | null }>) {
    const tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);
    // Clear must_reset_password so the freshly issued temp password logs in
    // directly, matching the behaviour of credentials created at approval.
    statements.push(
      db.prepare(`UPDATE attendees SET password_hash = ?, must_reset_password = 0 WHERE id = ?`)
        .bind(passwordHash, row.id)
    );
    reissued.push({
      name: row.name,
      ref_number: row.ref_number,
      temp_password: tempPassword,
      member_type: typeByName.get(row.name.trim().toLowerCase()) || 'adult',
      payment_due: row.payment_due || 0,
    });
  }

  return { statements, reissued };
}

// Helper: best-effort audit-log write. Never throws — an audit failure must not
// fail the operation it records, so any error is logged and swallowed.
async function writeAuditLog(
  db: D1Database,
  adminUser: string,
  action: string,
  registrationId: string,
  details: Record<string, unknown>,
  requestId: string
): Promise<void> {
  try {
    await db.prepare(
      `INSERT INTO audit_log (admin_user, action, entity_type, entity_id, details)
       VALUES (?, ?, 'registration', ?, ?)`
    ).bind(adminUser, action, parseInt(registrationId), JSON.stringify(details)).run();
  } catch (err) {
    console.warn(`[${requestId}] audit_log write failed`, err);
  }
}

// Helper: send the approval/credentials email, capturing whether it actually
// went out. We report delivery back to the admin rather than throwing, so the
// account changes (which have already committed) stand even when email fails.
async function trySendApprovalEmail(
  env: Env,
  registration: RegistrationRow,
  attendees: CreatedAttendee[],
  requestId: string
): Promise<{ emailSent: boolean; emailError: string | null }> {
  try {
    await sendApprovalEmail(
      env,
      registration.email,
      registration.name,
      attendees,
      registration.total_amount || 0,
      registration.payment_option
    );
    return { emailSent: true, emailError: null };
  } catch (err) {
    const emailError = err instanceof Error ? err.message : 'Unknown email failure';
    console.error(`[${requestId}] Failed to send approval email:`, err);
    return { emailSent: false, emailError };
  }
}

// Helper: Generate cryptographically random temporary password.
// Math.random is predictable enough that an attacker observing the approval
// timing window could narrow guesses; crypto.getRandomValues fixes that.
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

// Helper: Send approval email with credentials for all family members
async function sendApprovalEmail(
  env: Env,
  email: string,
  primaryName: string,
  attendees: CreatedAttendee[],
  totalAmount: number,
  paymentOption: string
): Promise<void> {
  if (!isEmailReady(env)) {
    console.warn('Email service not configured - skipping approval email');
    return;
  }

  const portalUrl = env.PORTAL_URL || 'https://retreat-manager.pages.dev';
  const retreatName = env.RETREAT_NAME || 'Growth and Wisdom Retreat';

  const paymentLabels: Record<string, string> = {
    full: 'Pay in Full',
    installments: 'Pay in Installments',
    sponsorship: 'Sponsorship Requested'
  };

  // Generate credentials table for all family members. Names and ref numbers
  // are admin-influenced but flow back through this email — escape defensively.
  const credentialsRows = attendees.map((attendee, index) => `
    <tr style="${index === 0 ? 'background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%);' : ''}">
      <td style="padding: 1rem; border-bottom: 1px solid #e5e7eb;">
        <strong style="color: #1f2937;">${escapeHtml(attendee.name)}</strong>
        ${index === 0 ? '<br><span style="font-size: 0.8rem; color: #667eea;">(Primary Contact)</span>' : ''}
        <br><span style="font-size: 0.8rem; color: #6b7280; text-transform: capitalize;">${escapeHtml(attendee.member_type)}</span>
      </td>
      <td style="padding: 1rem; border-bottom: 1px solid #e5e7eb; font-family: monospace; background: #f9fafb;">
        <strong style="color: #1f2937; font-size: 1.1rem;">${escapeHtml(attendee.ref_number)}</strong>
      </td>
      <td style="padding: 1rem; border-bottom: 1px solid #e5e7eb; font-family: monospace; background: #fef3c7;">
        <strong style="color: #92400e;">${escapeHtml(attendee.temp_password)}</strong>
      </td>
      <td style="padding: 1rem; border-bottom: 1px solid #e5e7eb; text-align: right;">
        ${attendee.payment_due === 0
          ? '<span style="color: #10b981; font-weight: bold;">FREE</span>'
          : `<strong style="color: #1f2937;">£${attendee.payment_due}</strong>`}
      </td>
    </tr>
  `).join('');

  const emailHtml = `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 700px; margin: 0 auto; background: #f8fafc; padding: 2rem;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 2rem; text-align: center; border-radius: 12px 12px 0 0;">
        <div style="font-size: 3rem; margin-bottom: 0.5rem;">🎉</div>
        <h1 style="margin: 0; font-size: 1.5rem;">Registration Approved!</h1>
        <p style="margin: 0.5rem 0 0 0; opacity: 0.9;">${escapeHtml(retreatName)}</p>
      </div>

      <!-- Content -->
      <div style="background: white; padding: 2rem; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

        <p style="font-size: 1.1rem; color: #1f2937; margin: 0 0 1.5rem 0;">
          Dear <strong>${escapeHtml(primaryName)}</strong>,
        </p>

        <p style="color: #4b5563; margin: 0 0 1.5rem 0;">
          Great news! Your family registration has been approved. Below are the login credentials for each family member to access the retreat portal.
        </p>

        <!-- Important Notice -->
        <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
          <strong style="color: #92400e;">⚠️ Important: Save These Credentials</strong>
          <p style="color: #b45309; margin: 0.5rem 0 0 0; font-size: 0.9rem;">
            Please save these login details securely. Each family member will need their own Reference Number and Password to log in.
          </p>
        </div>

        <!-- Credentials Table -->
        <h2 style="color: #1f2937; margin: 0 0 1rem 0; font-size: 1.1rem; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem;">
          🔐 Login Credentials (${attendees.length} Member${attendees.length > 1 ? 's' : ''})
        </h2>

        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; min-width: 500px;">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="padding: 0.75rem; text-align: left; color: #6b7280; font-size: 0.85rem;">Name</th>
                <th style="padding: 0.75rem; text-align: left; color: #6b7280; font-size: 0.85rem;">Reference #</th>
                <th style="padding: 0.75rem; text-align: left; color: #6b7280; font-size: 0.85rem;">Password</th>
                <th style="padding: 0.75rem; text-align: right; color: #6b7280; font-size: 0.85rem;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${credentialsRows}
            </tbody>
            <tfoot>
              <tr style="background: #f3f4f6;">
                <td colspan="3" style="padding: 0.75rem; font-weight: bold; color: #1f2937;">Total Amount Due</td>
                <td style="padding: 0.75rem; font-weight: bold; color: #667eea; text-align: right; font-size: 1.2rem;">£${totalAmount}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Payment Info -->
        <div style="background: #f0f9ff; border: 1px solid #0ea5e9; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
          <strong style="color: #0369a1;">💳 Payment Option: ${paymentLabels[paymentOption] || paymentOption}</strong>
          ${paymentOption === 'sponsorship' ? `
            <p style="color: #0284c7; margin: 0.5rem 0 0 0; font-size: 0.9rem;">
              Your sponsorship request has been noted. We will contact you with further details.
            </p>
          ` : paymentOption === 'installments' ? `
            <p style="color: #0284c7; margin: 0.5rem 0 0 0; font-size: 0.9rem;">
              You've chosen to pay in installments. Payment details will be provided separately.
            </p>
          ` : `
            <p style="color: #0284c7; margin: 0.5rem 0 0 0; font-size: 0.9rem;">
              Please arrange payment at your earliest convenience.
            </p>
          `}
        </div>

        <!-- How to Login -->
        <h2 style="color: #1f2937; margin: 0 0 1rem 0; font-size: 1.1rem; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem;">
          📱 How to Log In
        </h2>

        <ol style="color: #4b5563; padding-left: 1.5rem; margin: 0 0 1.5rem 0;">
          <li style="margin-bottom: 0.5rem;">Go to <a href="${portalUrl}" style="color: #667eea;">${portalUrl}</a></li>
          <li style="margin-bottom: 0.5rem;">Enter the Reference Number (e.g., ${attendees[0]?.ref_number})</li>
          <li style="margin-bottom: 0.5rem;">Enter the Password for that family member</li>
          <li style="margin-bottom: 0.5rem;">Click "Login" to access the portal</li>
        </ol>

        <!-- CTA Button -->
        <div style="text-align: center; margin: 2rem 0;">
          <a href="${portalUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 1rem 2rem; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 1.1rem;">
            Login to Portal →
          </a>
        </div>

        <!-- Footer -->
        <div style="border-top: 1px solid #e5e7eb; padding-top: 1.5rem; margin-top: 1rem; text-align: center;">
          <p style="color: #9ca3af; font-size: 0.85rem; margin: 0;">
            If you have any questions, please contact us at this email address.
          </p>
          <p style="color: #6b7280; font-size: 0.9rem; margin: 1rem 0 0 0;">
            We look forward to seeing your family at the retreat!
          </p>
          <p style="color: #667eea; font-weight: bold; margin: 0.5rem 0 0 0;">
            ${retreatName} Team
          </p>
        </div>
      </div>
    </div>
  `;

  await sendEmailOrThrow(env, {
    to: email,
    subject: `✅ Registration Approved - ${retreatName} (${attendees.length} Member${attendees.length > 1 ? 's' : ''})`,
    html: emailHtml,
  });

  console.log(`Approval email sent to ${email} for ${attendees.length} family members`);
}
