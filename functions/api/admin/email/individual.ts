// Individual email sending endpoint with TypeScript and validation

import type { PagesContext } from '../../../_shared/types.js';
import { createResponse, checkAdminAuth, handleCORS } from '../../../_shared/auth.js';
import { validate, individualEmailSchema } from '../../../_shared/validation.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../../_shared/errors.js';

interface AttendeeRow {
  id: number;
  name: string;
  email: string | null;
  ref_number: string;
  payment_due: number;
  room_number: string | null;
  group_name: string | null;
}

// Handle CORS preflight
export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

// POST /api/admin/email/individual - Send email to individual attendee
export async function onRequestPost(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));
    }

    const body = await context.request.json() as Record<string, unknown>;

    // Validate input
    const validation = validate(body, individualEmailSchema);
    if (!validation.valid) {
      return createErrorResponse(errors.validation(validation.errors, requestId));
    }

    const { attendee_id, subject, message, email_type } = body as {
      attendee_id: number;
      subject: string;
      message: string;
      email_type?: string;
    };

    // Get attendee details
    const { results: attendees } = await context.env.DB.prepare(`
      SELECT a.*, r.number as room_number, g.name as group_name
      FROM attendees a
      LEFT JOIN rooms r ON a.room_id = r.id
      LEFT JOIN groups g ON a.group_id = g.id
      WHERE a.id = ?
    `).bind(attendee_id).all();

    if (attendees.length === 0) {
      return createErrorResponse(errors.notFound('Attendee', requestId));
    }

    const attendee = attendees[0] as unknown as AttendeeRow;

    if (!attendee.email) {
      return createErrorResponse(errors.badRequest('Attendee does not have an email address', requestId));
    }

    // Check for required environment variables
    if (!context.env.RESEND_API_KEY || !context.env.FROM_EMAIL) {
      console.error(`[${requestId}] Email configuration missing`);
      return createErrorResponse(errors.internal('Email system not configured', requestId));
    }

    // Prepare email content
    const emailContent = generateEmailContent({
      attendee,
      subject,
      message,
      email_type,
      adminUser: admin.user
    });

    // Send email using Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${context.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: context.env.FROM_EMAIL,
        to: [attendee.email],
        subject: subject,
        html: emailContent
      })
    });

    if (response.ok) {
      const result = await response.json() as { id: string };

      return createResponse({
        success: true,
        message: 'Email sent successfully',
        email_id: result.id
      });
    } else {
      const errorText = await response.text();
      console.error(`[${requestId}] Resend API error:`, errorText);
      return createErrorResponse(errors.externalService('Email service', requestId));
    }

  } catch (error) {
    console.error(`[${requestId}] Email sending error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}

function generateEmailContent(options: {
  attendee: AttendeeRow;
  subject: string;
  message: string;
  email_type?: string;
  adminUser: string;
}): string {
  const { attendee, message, email_type, adminUser } = options;

  return `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0; font-size: 1.8rem;">Growth and Wisdom Retreat</h1>
        ${email_type === 'urgent' ? '<p style="margin: 0.5rem 0 0 0; background: rgba(255,255,255,0.2); padding: 0.5rem 1rem; border-radius: 20px; display: inline-block;">URGENT MESSAGE</p>' : ''}
      </div>

      <!-- Content -->
      <div style="background: white; padding: 2rem; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <!-- Personal Greeting -->
        <div style="margin-bottom: 1.5rem;">
          <h2 style="color: #1f2937; margin: 0 0 0.5rem 0;">Dear ${attendee.name},</h2>
          <p style="color: #6b7280; margin: 0;">Reference: ${attendee.ref_number}</p>
        </div>

        <!-- Message Content -->
        <div style="color: #374151; line-height: 1.6; margin-bottom: 2rem;">
          ${message.split('\n').map(paragraph => `<p style="margin: 0 0 1rem 0;">${paragraph}</p>`).join('')}
        </div>

        <!-- Attendee Info Box -->
        <div style="background: #f3f4f6; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
          <h3 style="color: #1f2937; margin: 0 0 0.5rem 0; font-size: 1rem;">Your Retreat Information:</h3>
          <ul style="margin: 0; padding-left: 1.2rem; color: #374151;">
            ${attendee.room_number ? `<li>Room: ${attendee.room_number}</li>` : ''}
            ${attendee.group_name ? `<li>Group: ${attendee.group_name}</li>` : ''}
            ${attendee.payment_due > 0 ? `<li>Outstanding Balance: $${attendee.payment_due.toFixed(2)}</li>` : '<li>Payment: Fully Paid</li>'}
          </ul>
        </div>

        <!-- Footer -->
        <div style="border-top: 1px solid #e5e7eb; padding-top: 1.5rem; margin-top: 2rem;">
          <p style="color: #6b7280; font-size: 0.875rem; margin: 0;">
            This message was sent by ${adminUser || 'Retreat Administration'}.
            If you have any questions, please contact the retreat coordinators.
          </p>
        </div>
      </div>
    </div>
  `;
}
