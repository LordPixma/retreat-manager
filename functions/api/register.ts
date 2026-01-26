// Public registration endpoint - no authentication required
// Allows families to submit registration forms with multiple members

import type { PagesContext, Env } from '../_shared/types.js';
import { createResponse, handleCORS } from '../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../_shared/errors.js';

// Admin notification email address
const ADMIN_NOTIFICATION_EMAIL = 'samuel.odekunle@cloverleafworld.org';

// Pricing constants
const PRICING = {
  adult: 200,      // 17+ years
  child: 60,       // 6-16 years
  infant: 0        // Under 6
};

interface FamilyMember {
  name: string;
  date_of_birth: string;
  dietary_requirements?: string;
  special_needs?: string;
  member_type: 'adult' | 'child' | 'infant';
  price: number;
}

interface RegistrationInput {
  members: FamilyMember[];
  email: string;
  phone: string;
  emergency_contact?: string;
  preferred_room_type?: string;
  payment_option: 'full' | 'installments' | 'sponsorship';
  special_requests?: string;
  total_amount: number;
}

interface ExistingRegistration {
  id: number;
  status: string;
}

// Handle CORS preflight
export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

// GET /api/register - Get registration form info (pricing, etc.)
export async function onRequestGet(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();

  try {
    // Return public info about registration options
    const roomTypes = ['family', 'single', 'double', 'suite', 'standard'];

    return createResponse({
      roomTypes,
      pricing: {
        adult: { price: PRICING.adult, description: 'Adults (17+ years)' },
        child: { price: PRICING.child, description: 'Children (6-16 years)' },
        infant: { price: PRICING.infant, description: 'Under 6 years (FREE)' }
      },
      message: 'Registration is open. Please fill out the form to register your family.'
    });
  } catch (error) {
    console.error(`[${requestId}] Error fetching registration info:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}

// POST /api/register - Submit a new family registration
export async function onRequestPost(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const body = await context.request.json() as Record<string, unknown>;

    // Validate input
    const validationErrors = validateRegistration(body);
    if (validationErrors.length > 0) {
      return createErrorResponse(errors.validation(
        validationErrors.reduce((acc, err) => ({ ...acc, [err.field]: err.message }), {}),
        requestId
      ));
    }

    const data = body as unknown as RegistrationInput;

    // Check if email already has a pending or approved registration
    const { results: existing } = await context.env.DB.prepare(`
      SELECT id, status FROM registrations
      WHERE email = ? AND status IN ('pending', 'approved')
    `).bind(data.email.trim().toLowerCase()).all();

    if (existing.length > 0) {
      const reg = existing[0] as unknown as ExistingRegistration;
      if (reg.status === 'approved') {
        return createErrorResponse(errors.conflict(
          'This email has already been registered and approved.',
          requestId
        ));
      }
      return createErrorResponse(errors.conflict(
        'A registration with this email is already pending review.',
        requestId
      ));
    }

    // Also check if email already exists as an attendee
    const { results: existingAttendee } = await context.env.DB.prepare(`
      SELECT id FROM attendees WHERE email = ?
    `).bind(data.email.trim().toLowerCase()).all();

    if (existingAttendee.length > 0) {
      return createErrorResponse(errors.conflict(
        'This email is already registered as an attendee. Please login instead.',
        requestId
      ));
    }

    // Calculate total and verify
    const calculatedTotal = calculateTotal(data.members);
    const primaryMember = data.members[0];

    // Insert new registration with family members as JSON
    const result = await context.env.DB.prepare(`
      INSERT INTO registrations (
        name, email, phone, emergency_contact,
        dietary_requirements, special_requests,
        preferred_room_type, payment_option, status,
        family_members, total_amount, member_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
    `).bind(
      primaryMember.name.trim(),
      data.email.trim().toLowerCase(),
      data.phone.trim(),
      data.emergency_contact?.trim() || null,
      data.members.map(m => m.dietary_requirements).filter(Boolean).join('; ') || null,
      data.special_requests?.trim() || null,
      data.preferred_room_type || 'family',
      data.payment_option,
      JSON.stringify(data.members),
      calculatedTotal,
      data.members.length
    ).run();

    if (!result.success) {
      throw new Error('Failed to submit registration');
    }

    // Send email notification to admin (non-blocking but keep worker alive)
    const emailPromise = sendRegistrationNotification(context.env, data, result.meta.last_row_id as number)
      .catch(err => console.error(`[${requestId}] Failed to send notification email:`, err));

    // Use waitUntil to ensure the email sends even after response is returned
    context.waitUntil(emailPromise);

    return createResponse({
      success: true,
      registrationId: result.meta.last_row_id,
      totalAmount: calculatedTotal,
      memberCount: data.members.length,
      message: 'Registration submitted successfully! You will receive an email once your registration is reviewed.'
    }, 201);

  } catch (error) {
    console.error(`[${requestId}] Error submitting registration:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}

// Validate registration data
function validateRegistration(body: Record<string, unknown>): Array<{field: string, message: string}> {
  const validationErrors: Array<{field: string, message: string}> = [];

  // Validate members array
  if (!Array.isArray(body.members) || body.members.length === 0) {
    validationErrors.push({ field: 'members', message: 'At least one family member is required' });
  } else {
    (body.members as Array<Record<string, unknown>>).forEach((member, index) => {
      if (!member.name || typeof member.name !== 'string' || !member.name.trim()) {
        validationErrors.push({ field: `members[${index}].name`, message: `Member ${index + 1}: Name is required` });
      }
      if (!member.date_of_birth || typeof member.date_of_birth !== 'string') {
        validationErrors.push({ field: `members[${index}].date_of_birth`, message: `Member ${index + 1}: Date of birth is required` });
      }
    });
  }

  // Validate email
  if (!body.email || typeof body.email !== 'string' || !body.email.trim()) {
    validationErrors.push({ field: 'email', message: 'Email is required' });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email as string)) {
    validationErrors.push({ field: 'email', message: 'Invalid email format' });
  }

  // Validate phone
  if (!body.phone || typeof body.phone !== 'string' || !body.phone.trim()) {
    validationErrors.push({ field: 'phone', message: 'Phone number is required' });
  }

  // Validate payment option
  const validPaymentOptions = ['full', 'installments', 'sponsorship'];
  if (!body.payment_option || !validPaymentOptions.includes(body.payment_option as string)) {
    validationErrors.push({ field: 'payment_option', message: 'Please select a valid payment option' });
  }

  return validationErrors;
}

// Calculate total amount based on members
function calculateTotal(members: FamilyMember[]): number {
  return members.reduce((total, member) => {
    if (member.member_type === 'adult') return total + PRICING.adult;
    if (member.member_type === 'child') return total + PRICING.child;
    return total; // infant is free
  }, 0);
}

// Calculate age from date of birth
function calculateAge(dob: string): number {
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// Get member type label from type
function getMemberTypeLabel(type: string, dob: string): string {
  const age = calculateAge(dob);
  if (type === 'adult') return 'Adult';
  if (type === 'child') return `Child (${age} yrs)`;
  return `Under 6 (${age} yrs)`;
}

// Send email notification to admin about new registration
async function sendRegistrationNotification(
  env: Env,
  data: RegistrationInput,
  registrationId: number
): Promise<void> {
  if (!env.RESEND_API_KEY || !env.FROM_EMAIL) {
    console.warn('Email service not configured - skipping notification');
    return;
  }

  const paymentOptionLabels: Record<string, string> = {
    full: 'Pay in Full',
    installments: 'Pay in Installments',
    sponsorship: 'Requires Sponsorship'
  };

  const roomTypeLabels: Record<string, string> = {
    family: 'Family Room',
    standard: 'Standard Room',
    single: 'Single Room',
    double: 'Double Room',
    suite: 'Suite'
  };

  const currentDate = new Date().toLocaleString('en-GB', {
    dateStyle: 'full',
    timeStyle: 'short'
  });

  const paymentLabel = paymentOptionLabels[data.payment_option] || data.payment_option;
  const roomLabel = roomTypeLabels[data.preferred_room_type || 'family'] || data.preferred_room_type;
  const totalAmount = calculateTotal(data.members);
  const primaryMember = data.members[0];

  // Count member types
  const adultCount = data.members.filter(m => m.member_type === 'adult').length;
  const childCount = data.members.filter(m => m.member_type === 'child').length;
  const infantCount = data.members.filter(m => m.member_type === 'infant').length;

  // Highlight sponsorship requests
  const isSponsorshipRequest = data.payment_option === 'sponsorship';
  const headerColor = isSponsorshipRequest
    ? 'background: linear-gradient(135deg, #d97706 0%, #b45309 100%);'
    : 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);';
  const subjectPrefix = isSponsorshipRequest ? '🔔 [SPONSORSHIP] ' : '👨‍👩‍👧‍👦 ';

  // Generate family members table
  const membersTableRows = data.members.map((member, index) => `
    <tr>
      <td style="padding: 0.75rem; border-bottom: 1px solid #f3f4f6; color: #1f2937; font-weight: ${index === 0 ? 'bold' : 'normal'};">
        ${member.name}${index === 0 ? ' <span style="color: #f59e0b; font-size: 0.8rem;">(Primary)</span>' : ''}
      </td>
      <td style="padding: 0.75rem; border-bottom: 1px solid #f3f4f6; color: #6b7280;">${getMemberTypeLabel(member.member_type, member.date_of_birth)}</td>
      <td style="padding: 0.75rem; border-bottom: 1px solid #f3f4f6; color: #1f2937; text-align: right;">
        ${member.price === 0 ? '<span style="color: #10b981;">FREE</span>' : `£${member.price}`}
      </td>
    </tr>
    ${member.dietary_requirements || member.special_needs ? `
    <tr>
      <td colspan="3" style="padding: 0.5rem 0.75rem 0.75rem; border-bottom: 1px solid #f3f4f6; background: #f9fafb;">
        ${member.dietary_requirements ? `<span style="font-size: 0.85rem; color: #6b7280;"><strong>Diet:</strong> ${member.dietary_requirements}</span>` : ''}
        ${member.dietary_requirements && member.special_needs ? ' | ' : ''}
        ${member.special_needs ? `<span style="font-size: 0.85rem; color: #6b7280;"><strong>Special:</strong> ${member.special_needs}</span>` : ''}
      </td>
    </tr>
    ` : ''}
  `).join('');

  const emailHtml = `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 650px; margin: 0 auto; background: #f8fafc; padding: 2rem;">
      <!-- Header -->
      <div style="${headerColor} color: white; padding: 2rem; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0; font-size: 1.5rem;">New Family Registration</h1>
        <p style="margin: 0.5rem 0 0 0; opacity: 0.9;">Growth and Wisdom Retreat</p>
      </div>

      <!-- Content -->
      <div style="background: white; padding: 2rem; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

        ${isSponsorshipRequest ? `
        <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
          <strong style="color: #92400e;">⚠️ Sponsorship Request</strong>
          <p style="color: #b45309; margin: 0.5rem 0 0 0; font-size: 0.9rem;">This family has requested sponsorship assistance for ${data.members.length} member${data.members.length > 1 ? 's' : ''}.</p>
        </div>
        ` : ''}

        <!-- Summary Box -->
        <div style="background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%); border: 1px solid rgba(102, 126, 234, 0.2); padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
          <table style="width: 100%;">
            <tr>
              <td style="text-align: center; padding: 0.5rem;">
                <div style="font-size: 0.8rem; color: #6b7280;">Registration ID</div>
                <div style="font-weight: bold; color: #1f2937;">#${registrationId}</div>
              </td>
              <td style="text-align: center; padding: 0.5rem;">
                <div style="font-size: 0.8rem; color: #6b7280;">Family Members</div>
                <div style="font-weight: bold; color: #1f2937;">${data.members.length}</div>
              </td>
              <td style="text-align: center; padding: 0.5rem;">
                <div style="font-size: 0.8rem; color: #6b7280;">Total Amount</div>
                <div style="font-weight: bold; color: ${isSponsorshipRequest ? '#d97706' : '#667eea'}; font-size: 1.2rem;">£${totalAmount}</div>
              </td>
            </tr>
          </table>
        </div>

        <!-- Family Members -->
        <h2 style="color: #1f2937; margin: 0 0 1rem 0; font-size: 1.1rem; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem;">
          👨‍👩‍👧‍👦 Family Members
        </h2>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 1.5rem;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 0.75rem; text-align: left; color: #6b7280; font-size: 0.85rem;">Name</th>
              <th style="padding: 0.75rem; text-align: left; color: #6b7280; font-size: 0.85rem;">Type</th>
              <th style="padding: 0.75rem; text-align: right; color: #6b7280; font-size: 0.85rem;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${membersTableRows}
          </tbody>
          <tfoot>
            <tr style="background: #f3f4f6;">
              <td colspan="2" style="padding: 0.75rem; font-weight: bold; color: #1f2937;">Total</td>
              <td style="padding: 0.75rem; font-weight: bold; color: #667eea; text-align: right; font-size: 1.1rem;">£${totalAmount}</td>
            </tr>
          </tfoot>
        </table>

        <!-- Breakdown -->
        <div style="background: #f9fafb; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; font-size: 0.9rem;">
          <div style="color: #6b7280;">
            ${adultCount > 0 ? `<span style="margin-right: 1rem;"><strong>${adultCount}</strong> Adult${adultCount > 1 ? 's' : ''} × £200 = £${adultCount * 200}</span>` : ''}
            ${childCount > 0 ? `<span style="margin-right: 1rem;"><strong>${childCount}</strong> Child${childCount > 1 ? 'ren' : ''} × £60 = £${childCount * 60}</span>` : ''}
            ${infantCount > 0 ? `<span><strong>${infantCount}</strong> Under 6 = FREE</span>` : ''}
          </div>
        </div>

        <!-- Contact Details -->
        <h2 style="color: #1f2937; margin: 0 0 1rem 0; font-size: 1.1rem; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem;">
          📧 Contact Details
        </h2>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 1.5rem;">
          <tr>
            <td style="padding: 0.5rem 0; color: #6b7280; width: 35%;">Email</td>
            <td style="padding: 0.5rem 0; color: #1f2937;">${data.email}</td>
          </tr>
          <tr>
            <td style="padding: 0.5rem 0; color: #6b7280;">Phone</td>
            <td style="padding: 0.5rem 0; color: #1f2937;">${data.phone}</td>
          </tr>
          <tr>
            <td style="padding: 0.5rem 0; color: #6b7280;">Emergency Contact</td>
            <td style="padding: 0.5rem 0; color: #1f2937;">${data.emergency_contact || 'Not provided'}</td>
          </tr>
          <tr>
            <td style="padding: 0.5rem 0; color: #6b7280;">Room Preference</td>
            <td style="padding: 0.5rem 0; color: #1f2937;">${roomLabel}</td>
          </tr>
          <tr>
            <td style="padding: 0.5rem 0; color: #6b7280;">Payment Option</td>
            <td style="padding: 0.5rem 0; color: ${isSponsorshipRequest ? '#d97706' : '#1f2937'}; font-weight: ${isSponsorshipRequest ? 'bold' : 'normal'};">${paymentLabel}</td>
          </tr>
          ${data.special_requests ? `
          <tr>
            <td style="padding: 0.5rem 0; color: #6b7280; vertical-align: top;">Special Requests</td>
            <td style="padding: 0.5rem 0; color: #1f2937;">${data.special_requests}</td>
          </tr>
          ` : ''}
        </table>

        <!-- Footer -->
        <div style="border-top: 1px solid #e5e7eb; padding-top: 1.5rem; margin-top: 1rem; text-align: center;">
          <p style="color: #6b7280; font-size: 0.9rem; margin: 0;">Submitted on ${currentDate}</p>
          <p style="color: #9ca3af; font-size: 0.8rem; margin: 0.5rem 0 0 0;">
            Please review this registration in the admin portal.
          </p>
        </div>
      </div>
    </div>
  `;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.FROM_EMAIL,
      to: [ADMIN_NOTIFICATION_EMAIL],
      subject: `${subjectPrefix}Family Registration: ${primaryMember.name} (${data.members.length} members, £${totalAmount})`,
      html: emailHtml
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to send notification email: ${errorText}`);
  }
}
