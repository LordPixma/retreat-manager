// functions/api/admin/email/notifications.js
import { createResponse, checkAdminAuth, handleCORS } from '../../../_shared/auth.js';
import { headerStyles, typeIcons } from '../../../_shared/email-helpers.js';

// Handle CORS preflight
export async function onRequestOptions() {
  return handleCORS();
}

// POST /api/admin/email/notifications - Send automated notifications
export async function onRequestPost(context) {
  try {
    // Check admin authorization
    const admin = checkAdminAuth(context.request);
    if (!admin) {
      return createResponse({ error: 'Unauthorized' }, 401);
    }

    const { notification_type, attendee_id, custom_data } = await context.request.json();

    if (!notification_type) {
      return createResponse({ error: 'Notification type is required' }, 400);
    }

    const result = await sendNotification(context.env, {
      notification_type,
      attendee_id,
      custom_data,
      admin_user: admin.user || 'Admin'
    });

    return createResponse(result);

  } catch (error) {
    console.error('Error sending notification:', error);
    return createResponse({ error: 'Failed to send notification' }, 500);
  }
}

// Main notification sending function
async function sendNotification(env, { notification_type, attendee_id, custom_data, admin_user }) {
  if (!env.RESEND_API_KEY || !env.FROM_EMAIL) {
    throw new Error('Email service not configured');
  }

  let attendees = [];
  let emailTemplate = {};

  switch (notification_type) {
    case 'welcome':
      attendees = await getAttendeeById(env.DB, attendee_id);
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
      attendees = await getAttendeesByAnnouncement(env.DB, custom_data);
      emailTemplate = generateAnnouncementEmail(custom_data, admin_user);
      break;

    case 'room_assignment':
      attendees = await getAttendeeById(env.DB, attendee_id);
      emailTemplate = generateRoomAssignmentEmail(attendees[0], custom_data);
      break;

    case 'group_assignment':
      attendees = await getAttendeeById(env.DB, attendee_id);
      emailTemplate = generateGroupAssignmentEmail(attendees[0], custom_data);
      break;

    default:
      throw new Error('Invalid notification type');
  }

  if (attendees.length === 0) {
    return { success: false, message: 'No attendees found for notification' };
  }

  // Send emails
  const results = { successful: 0, failed: 0, errors: [] };

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
          html: emailTemplate.html || generateGenericTemplate(emailTemplate, attendee, env.FROM_EMAIL)
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
      results.errors.push(`${attendee.name}: ${error.message}`);
    }
  }

  return {
    success: true,
    message: `Notification sent to ${results.successful} attendees`,
    results
  };
}

// Database query functions
async function getAttendeeById(db, id) {
  const { results } = await db.prepare(`
    SELECT a.*, r.number as room_number, g.name as group_name
    FROM attendees a
    LEFT JOIN rooms r ON a.room_id = r.id
    LEFT JOIN groups g ON a.group_id = g.id
    WHERE a.id = ? AND a.email IS NOT NULL AND a.email != ''
  `).bind(id).all();
  
  return results;
}

async function getAttendeesWithOutstandingPayments(db) {
  const { results } = await db.prepare(`
    SELECT a.*, r.number as room_number, g.name as group_name
    FROM attendees a
    LEFT JOIN rooms r ON a.room_id = r.id
    LEFT JOIN groups g ON a.group_id = g.id
    WHERE a.payment_due > 0 AND a.email IS NOT NULL AND a.email != ''
    ORDER BY a.payment_due DESC
  `).all();
  
  return results;
}

async function getAttendeesByAnnouncement(db, announcementData) {
  let query = `
    SELECT DISTINCT a.*, r.number as room_number, g.name as group_name
    FROM attendees a
    LEFT JOIN rooms r ON a.room_id = r.id
    LEFT JOIN groups g ON a.group_id = g.id
    WHERE a.email IS NOT NULL AND a.email != ''
  `;
  
  const bindings = [];

  if (announcementData.target_audience === 'groups' && announcementData.target_groups) {
    const placeholders = announcementData.target_groups.map(() => '?').join(',');
    query += ` AND g.name IN (${placeholders})`;
    bindings.push(...announcementData.target_groups);
  } else if (announcementData.target_audience === 'vip') {
    query += ` AND g.name = 'VIP Group'`;
  }

  const { results } = await db.prepare(query).bind(...bindings).all();
  return results;
}

// Email template generators
function generateWelcomeEmail(attendee, customData) {
  return {
    subject: `🎉 Welcome to Growth and Wisdom Retreat - Your Login Details`,
    message: `Welcome to the Growth and Wisdom Retreat portal!

Your account has been successfully created. Here are your login details:

📝 Reference Number: ${attendee.ref_number}
🔐 Password: ${customData?.password || '[Password provided separately]'}

You can now access your dashboard to:
• View important announcements
• Check your room assignment
• Review payment details
• Connect with your group

${attendee.room_number ? `🏠 Your room assignment: ${attendee.room_number}` : ''}
${attendee.group_name ? `👥 Your group: ${attendee.group_name}` : ''}

We're excited to have you join us for this transformative experience!`,
    email_type: 'welcome'
  };
}

function generatePaymentReminderEmail(attendee, customData) {
  const dueAmount = attendee?.payment_due || customData?.amount || 0;
  
  return {
    subject: `💳 Payment Reminder - Growth and Wisdom Retreat`,
    message: `This is a friendly reminder about your outstanding payment for the Growth and Wisdom Retreat.

💰 Amount Due: $${dueAmount.toFixed(2)}
📅 Due Date: ${customData?.due_date || 'As soon as possible'}

${customData?.payment_instructions || `To make your payment, please contact us at growthandwisdom@cloverleafworld.org or call us during business hours.

Payment can be made via:
• Bank transfer
• Check
• Credit card (over the phone)`}

Thank you for your prompt attention to this matter. We look forward to seeing you at the retreat!`,
    email_type: 'payment'
  };
}

function generateAnnouncementEmail(announcementData, sender) {
  return {
    subject: `📢 ${announcementData.title}`,
    message: announcementData.content,
    email_type: announcementData.type || 'announcement',
    sender
  };
}

function generateRoomAssignmentEmail(attendee, customData) {
  return {
    subject: `🏠 Room Assignment - Growth and Wisdom Retreat`,
    message: `Great news! Your room assignment has been confirmed.

🏠 Room Number: ${customData.room_number}
${customData.room_description ? `📝 Description: ${customData.room_description}` : ''}

${customData.notes || 'Please bring any personal items you need for a comfortable stay. Check-in details will be provided closer to the retreat date.'}

If you have any special accommodation needs, please contact us as soon as possible.`,
    email_type: 'reminder'
  };
}

function generateGroupAssignmentEmail(attendee, customData) {
  return {
    subject: `👥 Group Assignment - Growth and Wisdom Retreat`,
    message: `You've been assigned to a group for the Growth and Wisdom Retreat!

👥 Group Name: ${customData.group_name}
${customData.group_description ? `📝 Description: ${customData.group_description}` : ''}

${customData.notes || 'Your group will be a wonderful opportunity to connect with fellow attendees and share in meaningful discussions and activities.'}

We encourage you to introduce yourself to your group members when you arrive at the retreat.`,
    email_type: 'reminder'
  };
}

// Generic email template wrapper
function generateGenericTemplate(templateData, attendee, fromEmail) {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const headerStyle = headerStyles[templateData.email_type] || headerStyles.default;
  const icon = typeIcons[templateData.email_type] || typeIcons.announcement;

  return `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 2rem;">
      <div style="${headerStyle} color: white; padding: 2rem; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0; font-size: 1.8rem;">${icon} ${templateData.subject.replace(/^[🎉🚨💳📢⏰]\s*/, '')}</h1>
        <p style="margin: 0.5rem 0 0 0; opacity: 0.9;">Growth and Wisdom Retreat Portal</p>
      </div>
      
      <div style="background: white; padding: 2rem; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <div style="margin-bottom: 1.5rem;">
          <h3 style="color: #1f2937; margin: 0 0 0.5rem 0;">Hello ${attendee.name}! 👋</h3>
          <p style="color: #6b7280; margin: 0; font-size: 0.9rem;">Reference: ${attendee.ref_number}</p>
        </div>
        
        <div style="background: #f9fafb; padding: 1.5rem; border-radius: 8px; border-left: 4px solid #667eea; margin: 1.5rem 0;">
          <div style="color: #374151; line-height: 1.6; white-space: pre-wrap;">${templateData.message}</div>
        </div>
        
        ${templateData.email_type === 'welcome' ? `
        <div style="text-align: center; margin: 2rem 0;">
          <a href="https://retreat.cloverleafchristiancentre.org" 
             style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
            🚀 Access Your Dashboard
          </a>
        </div>
        ` : ''}
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 1.5rem; margin-top: 2rem; color: #6b7280; font-size: 0.875rem; text-align: center;">
          <div style="margin-bottom: 1rem;">
            📧 growthandwisdom@cloverleafworld.org | 🕒 Mon-Fri, 9AM-5PM
          </div>
          <div style="padding: 1rem; background: #f3f4f6; border-radius: 6px;">
            <div><strong>Sent:</strong> ${currentDate}</div>
            <div style="margin-top: 0.5rem; font-size: 0.8rem; color: #9ca3af;">Growth and Wisdom Retreat Portal</div>
          </div>
        </div>
      </div>
    </div>
  `;
}
