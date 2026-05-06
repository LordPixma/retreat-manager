// Admin registration detail endpoint
// View, approve, reject, or delete individual registrations

import type { PagesContext, Env } from '../../../_shared/types.js';
import { createResponse, checkAdminAuth, handleCORS, hashPassword } from '../../../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../../_shared/errors.js';
import { splitFullName } from '../../../_shared/names.js';
import { escapeHtml } from '../../../_shared/sanitize.js';
import { sendEmailOrThrow } from '../../../_shared/email.js';

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
  action: 'approve' | 'reject' | 'waitlist';
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

    if (!body.action || !['approve', 'reject', 'waitlist'].includes(body.action)) {
      return createErrorResponse(errors.badRequest('Valid action is required (approve, reject, waitlist)', requestId));
    }

    if (body.action === 'approve') {
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

      // Get group_id if specified
      const groupId: number | null = body.group_id || null;

      // Create attendee accounts for ALL family members
      const createdAttendees: CreatedAttendee[] = [];

      for (let i = 0; i < familyMembers.length; i++) {
        const member = familyMembers[i];
        const tempPassword = generateTempPassword();
        const passwordHash = await hashPassword(tempPassword);

        // First member is primary - gets email and phone
        const isPrimary = i === 0;
        const memberName = member.name.trim();
        const { first: firstName, last: lastName } = splitFullName(memberName);

        // Retry the INSERT on UNIQUE-constraint collision so two concurrent
        // approvals don't fail one another. Each retry generates a fresh
        // ref_number with an offset.
        let refNumber = '';
        const MAX_REF_ATTEMPTS = 5;
        let attemptIdx = 0;
        for (; attemptIdx < MAX_REF_ATTEMPTS; attemptIdx++) {
          refNumber = await generateRefNumber(context.env.DB, attemptIdx);
          try {
            const attendeeResult = await context.env.DB.prepare(`
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
              member.date_of_birth?.trim() || null,
              isPrimary ? registration.email : null, // Only primary gets email
              passwordHash,
              isPrimary ? registration.phone : null, // Only primary gets phone
              isPrimary ? registration.emergency_contact : null,
              member.dietary_requirements || member.special_needs || null,
              isPrimary ? registration.special_requests : null,
              body.room_id || null,
              groupId,
              member.price || 0,
              registration.payment_option || 'full',
              registration.id
            ).run();

            if (!attendeeResult.success) {
              throw new Error(`Failed to create attendee for ${member.name}`);
            }
            break; // success
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            if (msg.includes('UNIQUE') && attemptIdx < MAX_REF_ATTEMPTS - 1) {
              continue; // collision — try a higher ref number
            }
            throw err;
          }
        }

        createdAttendees.push({
          name: member.name,
          ref_number: refNumber,
          temp_password: tempPassword,
          member_type: member.member_type,
          payment_due: member.price || 0
        });
      }

      // Update registration status
      await context.env.DB.prepare(`
        UPDATE registrations
        SET status = 'approved', notes = ?, reviewed_at = CURRENT_TIMESTAMP, reviewed_by = ?
        WHERE id = ?
      `).bind(body.notes || null, admin.user || 'Admin', registrationId).run();

      try {
        await context.env.DB.prepare(
          `INSERT INTO audit_log (admin_user, action, entity_type, entity_id, details)
           VALUES (?, 'approve', 'registration', ?, ?)`
        ).bind(
          admin.user || 'Admin',
          parseInt(registrationId),
          JSON.stringify({ attendees_created: createdAttendees.length, primary_email: registration.email })
        ).run();
      } catch (err) {
        console.warn(`[${requestId}] audit_log write failed`, err);
      }

      // Send approval email with all credentials. We await the result so the
      // response can tell the admin whether credentials were actually
      // delivered — the UI must not claim "Credentials sent to X" when the
      // email transport fails. The send itself is fast enough (Cloudflare
      // Email Send returns a messageId quickly) that this doesn't materially
      // delay the response.
      let emailSent = false;
      let emailError: string | null = null;
      try {
        await sendApprovalEmail(
          context.env,
          registration.email,
          registration.name,
          createdAttendees,
          registration.total_amount || 0,
          registration.payment_option
        );
        emailSent = true;
      } catch (err) {
        emailError = err instanceof Error ? err.message : 'Unknown email failure';
        console.error(`[${requestId}] Failed to send approval email:`, err);
      }

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

// Helper: Generate unique reference number.
// Concurrent approvals previously raced — both readers got the same MAX, both
// computed the same +1, and the second INSERT failed on the UNIQUE constraint.
// We now retry a few times with a fresh MAX read before giving up; the
// downstream INSERT is what definitively claims the slot.
async function generateRefNumber(db: D1Database, attempt = 0): Promise<string> {
  const prefix = 'REF';
  const year = new Date().getFullYear().toString().slice(-2);

  const { results } = await db.prepare(`
    SELECT ref_number FROM attendees
    WHERE ref_number LIKE ?
    ORDER BY ref_number DESC
    LIMIT 1
  `).bind(`${prefix}${year}%`).all();

  let nextNumber = 1;
  if (results.length > 0) {
    const lastRef = (results[0] as unknown as { ref_number: string }).ref_number;
    const numPart = parseInt(lastRef.slice(5), 10);
    if (!isNaN(numPart)) {
      nextNumber = numPart + 1;
    }
  }
  // Stagger retries so two parallel approvals don't keep colliding.
  nextNumber += attempt;

  return `${prefix}${year}${nextNumber.toString().padStart(4, '0')}`;
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
  if (!env.EMAIL || !env.FROM_EMAIL) {
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
