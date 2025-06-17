// functions/api/admin/email/send.js
import { createResponse, checkAdminAuth, handleCORS } from '../../../_shared/auth.js';
import { headerStyles, typeIcons } from '../../../_shared/email-helpers.js';

// Handle CORS preflight
export async function onRequestOptions() {
  return handleCORS();
}

// POST /api/admin/email/send - Send bulk emails to attendees
export async function onRequestPost(context) {
  try {
    // Check admin authorization
    const admin = checkAdminAuth(context.request);
    if (!admin) {
      return createResponse({ error: 'Unauthorized' }, 401);
    }

    const { 
      subject, 
      message, 
      target_audience = 'all',
      target_groups,
      attendee_ids,
      email_type = 'announcement'
    } = await context.request.json();

    // Validate required fields
    if (!subject || !subject.trim()) {
      return createResponse({ error: 'Subject is required' }, 400);
    }
    if (!message || !message.trim()) {
      return createResponse({ error: 'Message is required' }, 400);
    }

    // Get target attendees based on criteria
    const attendees = await getTargetAttendees(context.env.DB, {
      target_audience,
      target_groups,
      attendee_ids
    });

    if (attendees.length === 0) {
      return createResponse({ error: 'No attendees found matching the criteria' }, 400);
    }

    // Send emails
    const emailResults = await sendBulkEmails(context.env, {
      attendees,
      subject,
      message,
      email_type,
      sender: admin.user || 'Admin'
    });

    return createResponse({
      success: true,
      message: `Emails sent to ${emailResults.successful} attendees`,
      results: {
        total: attendees.length,
        successful: emailResults.successful,
        failed: emailResults.failed,
        errors: emailResults.errors
      }
    });

  } catch (error) {
    console.error('Error sending bulk emails:', error);
    return createResponse({ error: 'Failed to send emails' }, 500);
  }
}

// Get target attendees based on criteria
async function getTargetAttendees(db, criteria) {
  let query = `
    SELECT DISTINCT a.id, a.name, a.email, a.ref_number,
           r.number as room_number, g.name as group_name
    FROM attendees a
    LEFT JOIN rooms r ON a.room_id = r.id
    LEFT JOIN groups g ON a.group_id = g.id
    WHERE a.email IS NOT NULL AND a.email != ''
  `;
  
  const bindings = [];

  if (criteria.attendee_ids && criteria.attendee_ids.length > 0) {
    // Specific attendees
    const placeholders = criteria.attendee_ids.map(() => '?').join(',');
    query += ` AND a.id IN (${placeholders})`;
    bindings.push(...criteria.attendee_ids);
  } else if (criteria.target_audience === 'groups' && criteria.target_groups && criteria.target_groups.length > 0) {
    // Specific groups
    const placeholders = criteria.target_groups.map(() => '?').join(',');
    query += ` AND g.name IN (${placeholders})`;
    bindings.push(...criteria.target_groups);
  } else if (criteria.target_audience === 'vip') {
    // VIP group members
    query += ` AND g.name = 'VIP Group'`;
  }
  // 'all' means no additional filtering

  query += ` ORDER BY a.name`;

  const { results } = await db.prepare(query).bind(...bindings).all();
  return results;
}

// Send bulk emails using Resend API
async function sendBulkEmails(env, emailData) {
  if (!env.RESEND_API_KEY || !env.FROM_EMAIL) {
    throw new Error('Email service not configured');
  }

  const { attendees, subject, message, email_type, sender } = emailData;
  const results = { successful: 0, failed: 0, errors: [] };
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Process emails in batches to avoid rate limits
  const batchSize = 10;
  for (let i = 0; i < attendees.length; i += batchSize) {
    const batch = attendees.slice(i, i + batchSize);
    
    await Promise.all(batch.map(async (attendee) => {
      try {
        const emailHtml = generateEmailTemplate({
          attendee,
          subject,
          message,
          email_type,
          sender,
          fromEmail: env.FROM_EMAIL,
          currentDate
        });

        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: env.FROM_EMAIL,
            to: [attendee.email],
            subject: subject,
            html: emailHtml
          })
        });

        if (response.ok) {
          results.successful++;
        } else {
          const errorText = await response.text();
          results.failed++;
          results.errors.push(`${attendee.name} (${attendee.email}): ${errorText}`);
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`${attendee.name} (${attendee.email}): ${error.message}`);
      }
    }));

    // Small delay between batches to respect rate limits
    if (i + batchSize < attendees.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}

// Generate email template based on type and content
function generateEmailTemplate({ attendee, subject, message, email_type, sender, fromEmail, currentDate }) {
  const headerStyle = headerStyles[email_type] || headerStyles.default;
  const icon = typeIcons[email_type] || typeIcons.announcement;

  return `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 2rem;">
      <!-- Header -->
      <div style="${headerStyle} color: white; padding: 2rem; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0; font-size: 1.8rem;">${icon} ${subject}</h1>
        <p style="margin: 0.5rem 0 0 0; opacity: 0.9;">Growth and Wisdom Retreat Portal</p>
      </div>
      
      <!-- Content -->
      <div style="background: white; padding: 2rem; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <!-- Greeting -->
        <div style="margin-bottom: 1.5rem;">
          <h3 style="color: #1f2937; margin: 0 0 0.5rem 0;">Hello ${attendee.name}! 👋</h3>
          <p style="color: #6b7280; margin: 0; font-size: 0.9rem;">Reference: ${attendee.ref_number}</p>
        </div>
        
        <!-- Message Content -->
        <div style="background: #f9fafb; padding: 1.5rem; border-radius: 8px; border-left: 4px solid #667eea; margin: 1.5rem 0;">
          <div style="color: #374151; line-height: 1.6; white-space: pre-wrap;">${message}</div>
        </div>
        
        <!-- Attendee Info (if available) -->
        ${attendee.room_number || attendee.group_name ? `
        <div style="background: #fef3c7; padding: 1rem; border-radius: 6px; margin: 1.5rem 0;">
          <h4 style="margin: 0 0 0.5rem 0; color: #92400e;">📍 Your Details</h4>
          <div style="color: #d97706; font-size: 0.9rem;">
            ${attendee.room_number ? `<div>🏠 Room: ${attendee.room_number}</div>` : ''}
            ${attendee.group_name ? `<div>👥 Group: ${attendee.group_name}</div>` : ''}
          </div>
        </div>
        ` : ''}
        
        <!-- Action Button (for certain email types) -->
        ${email_type === 'welcome' || email_type === 'reminder' ? `
        <div style="text-align: center; margin: 2rem 0;">
          <a href="https://retreat.cloverleafchristiancentre.org" 
             style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
            🚀 Access Your Dashboard
          </a>
        </div>
        ` : ''}
        
        <!-- Footer -->
        <div style="border-top: 1px solid #e5e7eb; padding-top: 1.5rem; margin-top: 2rem;">
          <div style="color: #6b7280; font-size: 0.875rem;">
            <div style="margin-bottom: 1rem;">
              <strong>Need Help?</strong><br>
              📧 Email: growthandwisdom@cloverleafworld.org<br>
              🕒 Support Hours: Monday - Friday, 9AM - 5PM
            </div>
            
        <div style="padding: 1rem; background: #f3f4f6; border-radius: 6px; text-align: center;">
          <div><strong>Sent by:</strong>${sender || 'The Growth and Wisdom Retreat Team'}</div>
          <div><strong>Date:</strong> ${currentDate}</div>
          <div style="margin-top: 0.5rem; font-size: 0.8rem; color: #9ca3af;">
            Growth and Wisdom Retreat Portal
          </div>
        </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
