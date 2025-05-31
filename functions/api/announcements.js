// functions/api/announcements.js - Public endpoint for attendees
import { createResponse, checkAttendeeAuth, handleCORS } from '../_shared/auth.js';

// Handle CORS preflight
export async function onRequestOptions() {
  return handleCORS();
}

// GET /api/announcements - Get announcements for current attendee
export async function onRequestGet(context) {
  try {
    const attendee = checkAttendeeAuth(context.request);
    if (!attendee) {
      return createResponse({ error: 'Unauthorized' }, 401);
    }
    
    const ref = attendee.ref;
    
    // Get attendee's group information
    const { results: attendeeInfo } = await context.env.DB.prepare(`
      SELECT 
        a.group_id,
        g.name as group_name
      FROM attendees a
      LEFT JOIN groups g ON a.group_id = g.id
      WHERE a.ref_number = ?
    `).bind(ref).all();
    
    const userGroupId = attendeeInfo[0]?.group_id;
    const userGroupName = attendeeInfo[0]?.group_name;
    
    // Get relevant announcements
    const now = new Date().toISOString();
    const { results } = await context.env.DB.prepare(`
      SELECT 
        id,
        title,
        content,
        type,
        priority,
        target_audience,
        target_groups,
        author_name,
        starts_at,
        expires_at,
        created_at
      FROM announcements
      WHERE 
        is_active = 1
        AND (starts_at IS NULL OR starts_at <= ?)
        AND (expires_at IS NULL OR expires_at > ?)
        AND (
          target_audience = 'all'
          OR (target_audience = 'vip' AND ? IN (
            SELECT ref_number FROM attendees a 
            JOIN groups g ON a.group_id = g.id 
            WHERE g.name = 'VIP Group'
          ))
          OR (target_audience = 'groups' AND target_groups IS NOT NULL)
        )
      ORDER BY priority DESC, created_at DESC
    `).bind(now, now, ref).all();
    
    // Filter group-specific announcements
    const relevantAnnouncements = results.filter(announcement => {
      if (announcement.target_audience === 'groups' && announcement.target_groups) {
        try {
          const targetGroups = JSON.parse(announcement.target_groups);
          return userGroupId && targetGroups.includes(userGroupId);
        } catch {
          return false;
        }
      }
      return true;
    });
    
    // Format announcements for frontend
    const formattedAnnouncements = relevantAnnouncements.map(announcement => ({
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      priority: announcement.priority,
      author_name: announcement.author_name,
      created_at: announcement.created_at,
      starts_at: announcement.starts_at,
      expires_at: announcement.expires_at,
      is_new: isNewAnnouncement(announcement.created_at) // Helper function
    }));
    
    return createResponse({
      announcements: formattedAnnouncements,
      user_group: userGroupName || null,
      total_count: formattedAnnouncements.length
    });
    
  } catch (error) {
    console.error('Error fetching announcements for attendee:', error);
    return createResponse({ error: 'Failed to fetch announcements' }, 500);
  }
}

// Helper function to determine if announcement is "new" (within last 24 hours)
function isNewAnnouncement(createdAt) {
  const created = new Date(createdAt);
  const now = new Date();
  const hoursDiff = (now - created) / (1000 * 60 * 60);
  return hoursDiff <= 24;
}