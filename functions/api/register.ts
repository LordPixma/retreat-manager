// Public registration endpoint - no authentication required
// Allows multiple users to submit registration forms

import type { PagesContext, Env } from '../_shared/types.js';
import { createResponse, handleCORS } from '../_shared/auth.js';
import { validate, registrationSchema } from '../_shared/validation.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../_shared/errors.js';

// Admin notification email address
const ADMIN_NOTIFICATION_EMAIL = 'samuel.odekunle@cloverleafworld.org';

interface RegistrationInput {
  name: string;
  email: string;
  phone?: string;
  emergency_contact?: string;
  dietary_requirements?: string;
  special_requests?: string;
  preferred_room_type?: string;
  payment_option: 'full' | 'installments' | 'sponsorship';
}

interface ExistingRegistration {
  id: number;
  status: string;
}

// Handle CORS preflight
export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

// GET /api/register - Get registration form info (available room types, groups, etc.)
export async function onRequestGet(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();

  try {
    // Return public info about registration options
    const roomTypes = ['single', 'double', 'suite', 'family', 'standard'];

    // Get available groups that can be joined
    const { results: groups } = await context.env.DB.prepare(`
      SELECT name, description, max_members,
        (SELECT COUNT(*) FROM attendees WHERE group_id = groups.id) as current_members
      FROM groups
    `).all();

    const availableGroups = (groups as unknown as Array<{
      name: string;
      description: string | null;
      max_members: number | null;
      current_members: number;
    }>).filter(g => !g.max_members || g.current_members < g.max_members);

    return createResponse({
      roomTypes,
      groups: availableGroups.map(g => ({
        name: g.name,
        description: g.description,
        spotsAvailable: g.max_members ? g.max_members - g.current_members : 'unlimited'
      })),
      message: 'Registration is open. Please fill out the form to register.'
    });
  } catch (error) {
    console.error(`[${requestId}] Error fetching registration info:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}

// POST /api/register - Submit a new registration
export async function onRequestPost(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const body = await context.request.json() as Record<string, unknown>;

    // Validate input
    const validation = validate(body, registrationSchema);
    if (!validation.valid) {
      return createErrorResponse(errors.validation(validation.errors, requestId));
    }

    const data = body as RegistrationInput;

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

    // Insert new registration
    const result = await context.env.DB.prepare(`
      INSERT INTO registrations (
        name, email, phone, emergency_contact,
        dietary_requirements, special_requests,
        preferred_room_type, payment_option, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).bind(
      data.name.trim(),
      data.email.trim().toLowerCase(),
      data.phone?.trim() || null,
      data.emergency_contact?.trim() || null,
      data.dietary_requirements?.trim() || null,
      data.special_requests?.trim() || null,
      data.preferred_room_type || 'standard',
      data.payment_option
    ).run();

    if (!result.success) {
      throw new Error('Failed to submit registration');
    }

    // Send email notification to admin (non-blocking)
    sendRegistrationNotification(context.env, data, result.meta.last_row_id as number)
      .catch(err => console.error(`[${requestId}] Failed to send notification email:`, err));

    return createResponse({
      success: true,
      registrationId: result.meta.last_row_id,
      message: 'Registration submitted successfully! You will receive an email once your registration is reviewed.'
    }, 201);

  } catch (error) {
    console.error(`[${requestId}] Error submitting registration:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
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
    standard: 'Standard Room',
    single: 'Single Room',
    double: 'Double Room',
    family: 'Family Room',
    suite: 'Suite'
  };

  const currentDate = new Date().toLocaleString('en-GB', {
    dateStyle: 'full',
    timeStyle: 'short'
  });

  const paymentLabel = paymentOptionLabels[data.payment_option] || data.payment_option;
  const roomLabel = roomTypeLabels[data.preferred_room_type || 'standard'] || data.preferred_room_type;

  // Highlight sponsorship requests
  const isSponsorshipRequest = data.payment_option === 'sponsorship';
  const headerColor = isSponsorshipRequest
    ? 'background: linear-gradient(135deg, #d97706 0%, #b45309 100%);'
    : 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);';
  const subjectPrefix = isSponsorshipRequest ? '🔔 [SPONSORSHIP REQUEST] ' : '📝 ';

  const emailHtml = `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 2rem;">
      <!-- Header -->
      <div style="${headerColor} color: white; padding: 2rem; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0; font-size: 1.5rem;">New Registration Submitted</h1>
        <p style="margin: 0.5rem 0 0 0; opacity: 0.9;">Growth and Wisdom Retreat</p>
      </div>

      <!-- Content -->
      <div style="background: white; padding: 2rem; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

        ${isSponsorshipRequest ? `
        <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
          <strong style="color: #92400e;">⚠️ Sponsorship Request</strong>
          <p style="color: #b45309; margin: 0.5rem 0 0 0; font-size: 0.9rem;">This registrant has requested sponsorship assistance.</p>
        </div>
        ` : ''}

        <h2 style="color: #1f2937; margin: 0 0 1.5rem 0; font-size: 1.2rem; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem;">
          Registration Details
        </h2>

        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 0.75rem 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; width: 40%;">Registration ID</td>
            <td style="padding: 0.75rem 0; border-bottom: 1px solid #f3f4f6; color: #1f2937; font-weight: 500;">#${registrationId}</td>
          </tr>
          <tr>
            <td style="padding: 0.75rem 0; border-bottom: 1px solid #f3f4f6; color: #6b7280;">Full Name</td>
            <td style="padding: 0.75rem 0; border-bottom: 1px solid #f3f4f6; color: #1f2937; font-weight: 500;">${data.name}</td>
          </tr>
          <tr>
            <td style="padding: 0.75rem 0; border-bottom: 1px solid #f3f4f6; color: #6b7280;">Email Address</td>
            <td style="padding: 0.75rem 0; border-bottom: 1px solid #f3f4f6; color: #1f2937;">${data.email}</td>
          </tr>
          <tr>
            <td style="padding: 0.75rem 0; border-bottom: 1px solid #f3f4f6; color: #6b7280;">Phone Number</td>
            <td style="padding: 0.75rem 0; border-bottom: 1px solid #f3f4f6; color: #1f2937;">${data.phone || 'Not provided'}</td>
          </tr>
          <tr>
            <td style="padding: 0.75rem 0; border-bottom: 1px solid #f3f4f6; color: #6b7280;">Emergency Contact</td>
            <td style="padding: 0.75rem 0; border-bottom: 1px solid #f3f4f6; color: #1f2937;">${data.emergency_contact || 'Not provided'}</td>
          </tr>
          <tr>
            <td style="padding: 0.75rem 0; border-bottom: 1px solid #f3f4f6; color: #6b7280;">Preferred Room Type</td>
            <td style="padding: 0.75rem 0; border-bottom: 1px solid #f3f4f6; color: #1f2937;">${roomLabel}</td>
          </tr>
          <tr>
            <td style="padding: 0.75rem 0; border-bottom: 1px solid #f3f4f6; color: #6b7280;">Payment Option</td>
            <td style="padding: 0.75rem 0; border-bottom: 1px solid #f3f4f6; color: ${isSponsorshipRequest ? '#d97706' : '#1f2937'}; font-weight: ${isSponsorshipRequest ? 'bold' : '500'};">${paymentLabel}</td>
          </tr>
          <tr>
            <td style="padding: 0.75rem 0; border-bottom: 1px solid #f3f4f6; color: #6b7280;">Dietary Requirements</td>
            <td style="padding: 0.75rem 0; border-bottom: 1px solid #f3f4f6; color: #1f2937;">${data.dietary_requirements || 'None specified'}</td>
          </tr>
          <tr>
            <td style="padding: 0.75rem 0; color: #6b7280; vertical-align: top;">Special Requests</td>
            <td style="padding: 0.75rem 0; color: #1f2937;">${data.special_requests || 'None'}</td>
          </tr>
        </table>

        <!-- Footer -->
        <div style="border-top: 1px solid #e5e7eb; padding-top: 1.5rem; margin-top: 2rem; text-align: center;">
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
      subject: `${subjectPrefix}New Registration: ${data.name}`,
      html: emailHtml
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to send notification email: ${errorText}`);
  }
}
