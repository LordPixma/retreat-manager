// Create new file: functions/api/admin/email/individual.js
import { createResponse, checkAdminAuth, handleCORS } from '../../../_shared/auth.js';

// Handle CORS preflight
export async function onRequestOptions() {
  return handleCORS();
}

// POST /api/admin/email/individual - Send email to individual attendee
export async function onRequestPost(context) {
  try {
    // Check admin authorization
    const admin = checkAdminAuth(context.request);
    if (!admin) {
      return createResponse({ error: 'Unauthorized' }, 401);
    }

    const { attendee_id, subject, message, email_type } = await context.request.json();

    // Validate required fields
    if (!attendee_id || !subject || !message) {
      return createResponse({ 
        error: 'Missing required fields: attendee_id, subject, and message are required' 
      }, 400);
    }

    // Get attendee details
    const { results: attendees } = await context.env.DB.prepare(`
      SELECT a.*, r.number as room_number, g.name as group_name
      FROM attendees a
      LEFT JOIN rooms r ON a.room_id = r.id
      LEFT JOIN groups g ON a.group_id = g.id
      WHERE a.id = ?
    `).bind(attendee_id).all();

    if (attendees.length === 0) {
      return createResponse({ error: 'Attendee not found' }, 404);
    }

    const attendee = attendees[0];

    if (!attendee.email) {
      return createResponse({ error: 'Attendee does not have an email address' }, 400);
    }

    // Check for required environment variables
    if (!context.env.RESEND_API_KEY || !context.env.FROM_EMAIL) {
      console.error('Email configuration missing');
      return createResponse({ 
        error: 'Email system not configured. Please contact system administrator.' 
      }, 500);
    }

    // Prepare email content
    const emailContent = `
      <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0; font-size: 1.8rem;">Growth and Wisdom Retreat</h1>
          ${email_type === 'urgent' ? '<p style="margin: 0.5rem 0 0 0; background: rgba(255,255,255,0.2); padding: 0.5rem 1rem; border-radius: 20px; display: inline-block;">⚠️ URGENT MESSAGE</p>' : ''}
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
              ${attendee.payment_due > 0 ? `<li>Outstanding Balance: £${attendee.payment_due.toFixed(2)}</li>` : '<li>Payment: Fully Paid ✓</li>'}
            </ul>
          </div>

          <!-- Call to Action -->
          ${email_type === 'payment' && attendee.payment_due > 0 ? `
            <div style="text-align: center; margin: 2rem 0;">
              <a href="https://retreat.cloverleafchristiancentre.org" 
                 style="display: inline-block; background: #667eea; color: white; padding: 0.75rem 2rem; text-decoration: none; border-radius: 6px; font-weight: 600;">
                View Portal & Make Payment
              </a>
            </div>
          ` : `
            <div style="text-align: center; margin: 2rem 0;">
              <a href="https://retreat.cloverleafchristiancentre.org" 
                 style="display: inline-block; background: #667eea; color: white; padding: 0.75rem 2rem; text-decoration: none; border-radius: 6px; font-weight: 600;">
                Access Retreat Portal
              </a>
            </div>
          `}

          <!-- Footer -->
          <div style="border-top: 1px solid #e5e7eb; padding-top: 1.5rem; margin-top: 2rem;">
            <p style="color: #6b7280; font-size: 0.875rem; margin: 0;">
              This message was sent from the Growth and Wisdom Retreat administration.
              If you have any questions, please contact the retreat coordinators.
            </p>
          </div>
        </div>
      </div>
    `;

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
      const result = await response.json();
      
      // Log the email send
      await context.env.DB.prepare(`
        INSERT INTO email_log (attendee_id, email_type, subject, sent_by, sent_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(attendee_id, email_type || 'individual', subject, admin.user).run();

      return createResponse({ 
        success: true, 
        message: 'Email sent successfully',
        email_id: result.id 
      });
    } else {
      const errorText = await response.text();
      console.error('Resend API error:', errorText);
      
      return createResponse({ 
        error: 'Failed to send email. Please try again later.' 
      }, 500);
    }

  } catch (error) {
    console.error('Email sending error:', error);
    return createResponse({ 
      error: 'An error occurred while sending the email' 
    }, 500);
  }
}