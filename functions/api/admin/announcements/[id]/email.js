// functions/api/admin/announcements/[id]/email.js
import { createResponse, checkAdminAuth, handleCORS } from '../../../../_shared/auth.js';

// Handle CORS preflight
export async function onRequestOptions() {
  return handleCORS();
}

// POST /api/admin/announcements/:id/email - Send announcement as email
export async function onRequestPost(context) {
  try {
    // Check admin authorization
    const admin = checkAdminAuth(context.request);
    if (!admin) {
      return createResponse({ error: 'Unauthorized' }, 401);
    }

    const announcementId = context.params.id;
    
    if (!announcementId) {
      return createResponse({ error: 'Announcement ID is required' }, 400);
    }

    // Get announcement details
    const { results: announcements } = await context.env.DB.prepare(`
      SELECT * FROM announcements WHERE id = ?
    `).bind(announcementId).all();

    if (announcements.length === 0) {
      return createResponse({ error: 'Announcement not found' }, 404);
    }

    const announcement = announcements[0];

    // Get target attendees based on announcement criteria
    let query = `
      SELECT DISTINCT a.id, a.name, a.email, a.ref_number,
             r.number as room_number, g.name as group_name
      FROM attendees a
      LEFT JOIN rooms r ON a.room_id = r.id
      LEFT JOIN groups g ON a.group_id = g.id
      WHERE a.email IS NOT NULL AND a.email != ''
    `;
    
    const bindings = [];

    if (announcement.target_audience === 'groups' && announcement.target_groups) {
      const targetGroups = JSON.parse(announcement.target_groups);
      const placeholders = targetGroups.map(() => '?').join(',');
      query += ` AND g.name IN (${placeholders})`;
      bindings.push(...targetGroups);
    } else if (announcement.target_audience === 'vip') {
      query += ` AND g.name = 'VIP Group'`;
    }

    query += ` ORDER BY a.name`;

    const { results: attendees } = await context.env.DB.prepare(query).bind(...bindings).all();

    if (attendees.length === 0) {
      return createResponse({ error: 'No attendees found matching announcement criteria' }, 400);
    }

    // Send emails using the notification system
    const emailResults = await sendAnnouncementEmails(context.env, {
      announcement,
      attendees,
      admin_user: admin.user || 'Admin'
    });

    // Update announcement to mark as emailed
    await context.env.DB.prepare(`
      UPDATE announcements 
      SET email_sent = 1, email_sent_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).bind(announcementId).run();

    return createResponse({
      success: true,
      message: `Announcement emailed to ${emailResults.successful} attendees`,
      results: emailResults
    });

  } catch (error) {
    console.error('Error sending announcement email:', error);
    return createResponse({ error: 'Failed to send announcement email' }, 500);
  }
}

// Send announcement emails
async function sendAnnouncementEmails(env, { announcement, attendees, admin_user }) {
  if (!env.RESEND_API_KEY || !env.FROM_EMAIL) {
    throw new Error('Email service not configured');
  }

  const results = { successful: 0, failed: 0, errors: [] };

  // Process emails in batches
  const batchSize = 10;
  for (let i = 0; i < attendees.length; i += batchSize) {
    const batch = attendees.slice(i, i + batchSize);
    
    await Promise.all(batch.map(async (attendee) => {
      try {
        const emailHtml = generateAnnouncementEmailTemplate({
          attendee,
          announcement,
          admin_user,
          fromEmail: env.FROM_EMAIL
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
            subject: `📢 ${announcement.title}`,
            html: emailHtml
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
    }));

    // Small delay between batches
    if (i + batchSize < attendees.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}

// Generate email template for announcements
function generateAnnouncementEmailTemplate({ attendee, announcement, admin_user, fromEmail }) {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const getHeaderStyle = (type) => {
    switch (type) {
      case 'urgent':
        return 'background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);';
      case 'event':
        return 'background: linear-gradient(135deg, #059669 0%, #047857 100%);';
      case 'reminder':
        return 'background: linear-gradient(135deg, #d97706 0%, #b45309 100%);';
      default:
        return 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);';
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'urgent': return '🚨';
      case 'event': return '🎉';
      case 'reminder': return '⏰';
      default: return '📢';
    }
  };

  const getPriorityBadge = (priority) => {
    if (priority >= 4) {
      return '<span style="background: #dc2626; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 500;">HIGH PRIORITY</span>';
    } else if (priority >= 3) {
      return '<span style="background: #d97706; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 500;">MEDIUM PRIORITY</span>';
    }
    return '';
  };

  return `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 2rem;">
      <!-- Header -->
      <div style="${getHeaderStyle(announcement.type)} color: white; padding: 2rem; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0; font-size: 1.8rem;">${getIcon(announcement.type)} ${announcement.title}</h1>
        <p style="margin: 0.5rem 0 0 0; opacity: 0.9;">Growth and Wisdom Retreat Portal</p>
        ${getPriorityBadge(announcement.priority)}
      </div>
      
      <!-- Content -->
      <div style="background: white; padding: 2rem; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <!-- Greeting -->
        <div style="margin-bottom: 1.5rem;">
          <h3 style="color: #1f2937; margin: 0 0 0.5rem 0;">Hello ${attendee.name}! 👋</h3>
          <p style="color: #6b7280; margin: 0; font-size: 0.9rem;">Reference: ${attendee.ref_number}</p>
        </div>
        
        <!-- Announcement Badge -->
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 1rem; margin: 1.5rem 0;">
          <div style="display: flex; align-items: center; margin-bottom: 0.5rem;">
            <span style="background: #3b82f6; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 500; margin-right: 0.5rem;">ANNOUNCEMENT</span>
            <span style="color: #6b7280; font-size: 0.85rem;">${announcement.type.toUpperCase()}</span>
          </div>
        </div>
        
        <!-- Message Content -->
        <div style="background: #f9fafb; padding: 1.5rem; border-radius: 8px; border-left: 4px solid #667eea; margin: 1.5rem 0;">
          <div style="color: #374151; line-height: 1.6; white-space: pre-wrap;">${announcement.content}</div>
        </div>
        
        <!-- Attendee Info -->
        ${attendee.room_number || attendee.group_name ? `
        <div style="background: #fef3c7; padding: 1rem; border-radius: 6px; margin: 1.5rem 0;">
          <h4 style="margin: 0 0 0.5rem 0; color: #92400e;">📍 Your Details</h4>
          <div style="color: #d97706; font-size: 0.9rem;">
            ${attendee.room_number ? `<div>🏠 Room: ${attendee.room_number}</div>` : ''}
            ${attendee.group_name ? `<div>👥 Group: ${attendee.group_name}</div>` : ''}
          </div>
        </div>
        ` : ''}
        
        <!-- Action Button for urgent announcements -->
        ${announcement.type === 'urgent' || announcement.priority >= 4 ? `
        <div style="text-align: center; margin: 2rem 0;">
          <a href="https://retreat.cloverleafchristiancentre.org" 
             style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
            🚀 View Full Details
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
              <div><strong>Announcement by:</strong> ${admin_user}</div>
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

