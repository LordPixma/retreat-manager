// Automated notifications endpoint with TypeScript

import type { PagesContext, Env } from '../../../_shared/types.js';
import { createResponse, checkAdminAuth, handleCORS } from '../../../_shared/auth.js';
import { headerStyles, typeIcons } from '../../../_shared/email-helpers.js';
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

interface EmailTemplate {
  subject: string;
  message: string;
  email_type: string;
  html?: string;
  sender?: string;
}

interface NotificationResults {
  successful: number;
  failed: number;
  errors: string[];
}

// Handle CORS preflight
export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

// POST /api/admin/email/notifications - Send automated notifications
export async function onRequestPost(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));
    }

    const { notification_type, attendee_id, custom_data } = await context.request.json() as {
      notification_type: string;
      attendee_id?: number;
      custom_data?: Record<string, unknown>;
    };

    if (!notification_type) {
      return createErrorResponse(errors.badRequest('Notification type is required', requestId));
    }

    const result = await sendNotification(context.env, {
      notification_type,
      attendee_id,
      custom_data,
      admin_user: admin.user || 'Admin'
    });

    return createResponse(result);

  } catch (error) {
    console.error(`[${requestId}] Error sending notification:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}

// Main notification sending function
async function sendNotification(
  env: Env,
  options: {
    notification_type: string;
    attendee_id?: number;
    custom_data?: Record<string, unknown>;
    admin_user: string;
  }
): Promise<{ success: boolean; message: string; results?: NotificationResults }> {
  const { notification_type, attendee_id, custom_data, admin_user } = options;

  if (!env.RESEND_API_KEY || !env.FROM_EMAIL) {
    throw new Error('Email service not configured');
  }

  let attendees: AttendeeRow[] = [];
  let emailTemplate: EmailTemplate;

  switch (notification_type) {
    case 'welcome':
      attendees = await getAttendeeById(env.DB, attendee_id!);
      emailTemplate = generateWelcomeEmail(attendees[0], custom_data);
      break;

    case 'payment_reminder':
      if (attendee_id) {
        attendees = await getAttendeeById(env.DB, attendee_id);
      } else {
        attendees = await getAttendeesWithOutstandingPayments(env.DB);
      }
      emailTemplate = generatePaymentReminderEmail(attendees[0] || null, custom_data);
      break;

    case 'announcement_urgent':
      attendees = await getAttendeesByAnnouncement(env.DB, custom_data || {});
      emailTemplate = generateAnnouncementEmail(custom_data || {}, admin_user);
      break;

    case 'room_assignment':
      attendees = await getAttendeeById(env.DB, attendee_id!);
      emailTemplate = generateRoomAssignmentEmail(attendees[0], custom_data);
      break;

    case 'group_assignment':
      attendees = await getAttendeeById(env.DB, attendee_id!);
      emailTemplate = generateGroupAssignmentEmail(attendees[0], custom_data);
      break;

    default:
      throw new Error('Invalid notification type');
  }

  if (attendees.length === 0) {
    return { success: false, message: 'No attendees found for notification' };
  }

  // Send emails
  const results: NotificationResults = { successful: 0, failed: 0, errors: [] };

  for (const attendee of attendees) {
    if (!attendee.email) {
      results.failed++;
      results.errors.push(`${attendee.name}: No email address`);
      continue;
    }

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
          subject: emailTemplate.subject,
          html: emailTemplate.html || generateGenericTemplate(emailTemplate, attendee)
        })
      });

      if (response.ok) {
        results.successful++;
      } else {
        const errorText = await response.text();
        results.failed++;
        results.errors.push(`${attendee.name}: ${errorText}`);
      }
    } catch (error) {
      results.failed++;
      results.errors.push(`${attendee.name}: ${(error as Error).message}`);
    }
  }

  return {
    success: true,
    message: `Notification sent to ${results.successful} attendees`,
    results
  };
}

// Database query functions
async function getAttendeeById(db: D1Database, id: number): Promise<AttendeeRow[]> {
  const { results } = await db.prepare(`
    SELECT a.*, r.number as room_number, g.name as group_name
    FROM attendees a
    LEFT JOIN rooms r ON a.room_id = r.id
    LEFT JOIN groups g ON a.group_id = g.id
    WHERE a.id = ? AND a.email IS NOT NULL AND a.email != ''
  `).bind(id).all();

  return results as unknown as AttendeeRow[];
}

async function getAttendeesWithOutstandingPayments(db: D1Database): Promise<AttendeeRow[]> {
  const { results } = await db.prepare(`
    SELECT a.*, r.number as room_number, g.name as group_name
    FROM attendees a
    LEFT JOIN rooms r ON a.room_id = r.id
    LEFT JOIN groups g ON a.group_id = g.id
    WHERE a.payment_due > 0 AND a.email IS NOT NULL AND a.email != ''
    ORDER BY a.payment_due DESC
  `).all();

  return results as unknown as AttendeeRow[];
}

async function getAttendeesByAnnouncement(db: D1Database, announcementData: Record<string, unknown>): Promise<AttendeeRow[]> {
  let query = `
    SELECT DISTINCT a.*, r.number as room_number, g.name as group_name
    FROM attendees a
    LEFT JOIN rooms r ON a.room_id = r.id
    LEFT JOIN groups g ON a.group_id = g.id
    WHERE a.email IS NOT NULL AND a.email != ''
  `;

  const bindings: string[] = [];

  if (announcementData.target_audience === 'groups' && announcementData.target_groups) {
    const targetGroups = announcementData.target_groups as string[];
    const placeholders = targetGroups.map(() => '?').join(',');
    query += ` AND g.name IN (${placeholders})`;
    bindings.push(...targetGroups);
  } else if (announcementData.target_audience === 'vip') {
    query += ` AND g.name = 'VIP Group'`;
  }

  const { results } = await db.prepare(query).bind(...bindings).all();
  return results as unknown as AttendeeRow[];
}

// Email template generators
function generateWelcomeEmail(attendee: AttendeeRow, customData?: Record<string, unknown>): EmailTemplate {
  return {
    subject: 'Welcome to Growth and Wisdom Retreat - Your Login Details',
    message: `Welcome to the Growth and Wisdom Retreat portal!

Your account has been successfully created. Here are your login details:

Reference Number: ${attendee.ref_number}
Password: ${(customData?.password as string) || '[Password provided separately]'}

You can now access your dashboard to:
- View important announcements
- Check your room assignment
- Review payment details
- Connect with your group

${attendee.room_number ? `Your room assignment: ${attendee.room_number}` : ''}
${attendee.group_name ? `Your group: ${attendee.group_name}` : ''}

We're excited to have you join us for this transformative experience!`,
    email_type: 'welcome'
  };
}

function generatePaymentReminderEmail(attendee: AttendeeRow | null, customData?: Record<string, unknown>): EmailTemplate {
  const dueAmount = attendee?.payment_due || (customData?.amount as number) || 0;

  return {
    subject: 'Payment Reminder - Growth and Wisdom Retreat',
    message: `This is a friendly reminder about your outstanding payment for the Growth and Wisdom Retreat.

Amount Due: $${dueAmount.toFixed(2)}
Due Date: ${(customData?.due_date as string) || 'As soon as possible'}

${(customData?.payment_instructions as string) || `To make your payment, please contact us at growthandwisdom@cloverleafworld.org or call us during business hours.

Payment can be made via:
- Bank transfer
- Check
- Credit card (over the phone)`}

Thank you for your prompt attention to this matter. We look forward to seeing you at the retreat!`,
    email_type: 'payment'
  };
}

function generateAnnouncementEmail(announcementData: Record<string, unknown>, sender: string): EmailTemplate {
  return {
    subject: `${announcementData.title as string}`,
    message: announcementData.content as string,
    email_type: (announcementData.type as string) || 'announcement',
    sender
  };
}

function generateRoomAssignmentEmail(_attendee: AttendeeRow, customData?: Record<string, unknown>): EmailTemplate {
  return {
    subject: 'Room Assignment - Growth and Wisdom Retreat',
    message: `Great news! Your room assignment has been confirmed.

Room Number: ${customData?.room_number as string}
${customData?.room_description ? `Description: ${customData.room_description}` : ''}

${(customData?.notes as string) || 'Please bring any personal items you need for a comfortable stay. Check-in details will be provided closer to the retreat date.'}

If you have any special accommodation needs, please contact us as soon as possible.`,
    email_type: 'reminder'
  };
}

function generateGroupAssignmentEmail(_attendee: AttendeeRow, customData?: Record<string, unknown>): EmailTemplate {
  return {
    subject: 'Group Assignment - Growth and Wisdom Retreat',
    message: `You've been assigned to a group for the Growth and Wisdom Retreat!

Group Name: ${customData?.group_name as string}
${customData?.group_description ? `Description: ${customData.group_description}` : ''}

${(customData?.notes as string) || 'Your group will be a wonderful opportunity to connect with fellow attendees and share in meaningful discussions and activities.'}

We encourage you to introduce yourself to your group members when you arrive at the retreat.`,
    email_type: 'reminder'
  };
}

// Generic email template wrapper
function generateGenericTemplate(templateData: EmailTemplate, attendee: AttendeeRow): string {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const headerStyle = headerStyles[templateData.email_type as keyof typeof headerStyles] || headerStyles.default;
  const icon = typeIcons[templateData.email_type as keyof typeof typeIcons] || typeIcons.announcement;

  return `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 2rem;">
      <div style="${headerStyle} color: white; padding: 2rem; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0; font-size: 1.8rem;">${icon} ${templateData.subject}</h1>
        <p style="margin: 0.5rem 0 0 0; opacity: 0.9;">Growth and Wisdom Retreat Portal</p>
      </div>

      <div style="background: white; padding: 2rem; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <div style="margin-bottom: 1.5rem;">
          <h3 style="color: #1f2937; margin: 0 0 0.5rem 0;">Hello ${attendee.name}!</h3>
          <p style="color: #6b7280; margin: 0; font-size: 0.9rem;">Reference: ${attendee.ref_number}</p>
        </div>

        <div style="background: #f9fafb; padding: 1.5rem; border-radius: 8px; border-left: 4px solid #667eea; margin: 1.5rem 0;">
          <div style="color: #374151; line-height: 1.6; white-space: pre-wrap;">${templateData.message}</div>
        </div>

        <div style="border-top: 1px solid #e5e7eb; padding-top: 1.5rem; margin-top: 2rem; color: #6b7280; font-size: 0.875rem; text-align: center;">
          <div style="padding: 1rem; background: #f3f4f6; border-radius: 6px;">
            <div><strong>Sent:</strong> ${currentDate}</div>
            <div style="margin-top: 0.5rem; font-size: 0.8rem; color: #9ca3af;">Growth and Wisdom Retreat Portal</div>
          </div>
        </div>
      </div>
    </div>
  `;
}
