// functions/api/me.js - Updated to include announcements
import { createResponse, checkAttendeeAuth, handleCORS } from '../_shared/auth.js';

// Handle CORS preflight
export async function onRequestOptions() {
  return handleCORS();
}

export async function onRequestGet(context) {
  try {
    const attendee = checkAttendeeAuth(context.request);
    if (!attendee) {
      return createResponse({ error: 'Unauthorized' }, 401);
    }
    
    const ref = attendee.ref;
    
    // Query attendee data with joins
    const { results } = await context.env.DB.prepare(`
      SELECT 
        a.name, 
        a.email,
        a.payment_due,
        r.number AS room_number, 
        r.description AS room_description,
        g.name AS group_name,
        a.group_id
      FROM attendees a
      LEFT JOIN rooms r ON a.room_id = r.id
      LEFT JOIN groups g ON a.group_id = g.id
      WHERE a.ref_number = ?
    `).bind(ref).all();
    
    if (!results.length) {
      return createResponse({ error: 'Attendee not found' }, 404);
    }
    
    const attendeeData = results[0];
    
    // Get group members if attendee is in a group
    let members = [];
    let groupFinancial = null;
    
    if (attendeeData.group_id) {
      // Get group members with payment information
      const { results: memberResults } = await context.env.DB.prepare(`
        SELECT name, ref_number, payment_due, email
        FROM attendees 
        WHERE group_id = ? AND ref_number != ?
        ORDER BY name
      `).bind(attendeeData.group_id, ref).all();
      
      members = memberResults.map(member => ({
        name: member.name,
        ref_number: member.ref_number,
        payment_due: member.payment_due || 0,
        email: member.email
      }));
      
      // Calculate group financial summary (including current user)
      const allMembers = [...members, {
        name: attendeeData.name,
        payment_due: attendeeData.payment_due || 0
      }];
      
      const totalOutstanding = allMembers.reduce((sum, member) => sum + (member.payment_due || 0), 0);
      const membersWithPayments = allMembers.filter(m => (m.payment_due || 0) > 0).length;
      
      groupFinancial = {
        totalOutstanding,
        membersWithPayments,
        totalMembers: allMembers.length
      };
    }
    
    // Get relevant announcements for this attendee
    const announcements = await getAttendeAnnouncements(context.env.DB, ref, attendeeData.group_id, attendeeData.group_name);
    
    // Format response
    const response = {
      name: attendeeData.name,
      email: attendeeData.email,
      payment_due: attendeeData.payment_due || 0,
      room: attendeeData.room_number ? {
        number: attendeeData.room_number,
        description: attendeeData.room_description || ''
      } : null,
      group: attendeeData.group_name ? {
        name: attendeeData.group_name,
        members: members,
        financial: groupFinancial  // Add financial data here
      } : null,
      announcements: announcements
    };
    
    return createResponse(response);
    
  } catch (error) {
    console.error('Error in /api/me:', error);
    return createResponse({ error: 'Internal server error' }, 500);
  }
}

/**
 * Get announcements relevant to a specific attendee
 */
async function getAttendeAnnouncements(db, ref, groupId, groupName) {
  try {
    const now = new Date().toISOString();
    
    // Get all active announcements that haven't expired
    const { results } = await db.prepare(`
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
      ORDER BY priority DESC, created_at DESC
      LIMIT 10
    `).bind(now, now).all();
    
    // Filter announcements based on target audience
    const relevantAnnouncements = results.filter(announcement => {
      // All announcements
      if (announcement.target_audience === 'all') {
        return true;
      }
      
      // VIP announcements (check if user is in VIP group)
      if (announcement.target_audience === 'vip') {
        return groupName === 'VIP Group';
      }
      
      // Group-specific announcements
      if (announcement.target_audience === 'groups' && announcement.target_groups && groupId) {
        try {
          const targetGroups = JSON.parse(announcement.target_groups);
          return targetGroups.includes(groupId);
        } catch {
          return false;
        }
      }
      
      return false;
    });
    
    // Format announcements for frontend
    return relevantAnnouncements.map(announcement => ({
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      priority: announcement.priority,
      author_name: announcement.author_name,
      created_at: announcement.created_at,
      starts_at: announcement.starts_at,
      expires_at: announcement.expires_at,
      is_new: isNewAnnouncement(announcement.created_at),
      type_badge: getTypeBadge(announcement.type),
      priority_badge: getPriorityBadge(announcement.priority)
    }));
    
  } catch (error) {
    console.error('Error fetching attendee announcements:', error);
    return [];
  }
}

/**
 * Check if announcement is new (within last 24 hours)
 */
function isNewAnnouncement(createdAt) {
  const created = new Date(createdAt);
  const now = new Date();
  const hoursDiff = (now - created) / (1000 * 60 * 60);
  return hoursDiff <= 24;
}

/**
 * Get group financial summary for attendee dashboard
 */
async function getGroupFinancialSummary(db, groupId) {
    if (!groupId) return null;
    
    try {
        const { results } = await db.prepare(`
            SELECT 
                a.name,
                a.ref_number,
                a.payment_due,
                a.email
            FROM attendees a
            WHERE a.group_id = ?
            ORDER BY a.name
        `).bind(groupId).all();
        
        const totalOutstanding = results.reduce((sum, member) => sum + (member.payment_due || 0), 0);
        const membersWithPayments = results.filter(m => (m.payment_due || 0) > 0);
        
        return {
            totalOutstanding,
            membersWithPayments: membersWithPayments.length,
            totalMembers: results.length,
            members: results.map(member => ({
                name: member.name,
                ref_number: member.ref_number,
                payment_due: member.payment_due || 0,
                email: member.email,
                hasPendingPayment: (member.payment_due || 0) > 0
            }))
        };
    } catch (error) {
        console.error('Error getting group financial summary:', error);
        return null;
    }
}

/**
 * Get type badge configuration
 */
function getTypeBadge(type) {
  const badges = {
    'general': { text: 'General', class: 'badge-secondary', icon: 'fas fa-info-circle' },
    'urgent': { text: 'Urgent', class: 'badge-warning', icon: 'fas fa-exclamation-triangle' },
    'event': { text: 'Event', class: 'badge-primary', icon: 'fas fa-calendar' },
    'reminder': { text: 'Reminder', class: 'badge-success', icon: 'fas fa-clock' }
  };
  return badges[type] || badges['general'];
}

/**
 * Get priority badge configuration
 */
function getPriorityBadge(priority) {
  if (priority >= 4) {
    return { text: 'High Priority', class: 'badge-warning', icon: 'fas fa-exclamation' };
  } else if (priority >= 3) {
    return { text: 'Normal', class: 'badge-secondary', icon: 'fas fa-info' };
  } else {
    return { text: 'Low Priority', class: 'badge-secondary', icon: 'fas fa-info' };
  }
}