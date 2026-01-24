// Current user profile endpoint with TypeScript

import type { PagesContext } from '../_shared/types.js';
import { createResponse, checkAttendeeAuth, handleCORS } from '../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../_shared/errors.js';

interface AttendeeRow {
  name: string;
  email: string | null;
  payment_due: number;
  room_number: string | null;
  room_description: string | null;
  group_name: string | null;
  group_id: number | null;
}

interface MemberRow {
  name: string;
  ref_number: string;
  payment_due: number;
  email: string | null;
}

interface AnnouncementRow {
  id: number;
  title: string;
  content: string;
  type: string;
  priority: number;
  target_audience: string;
  target_groups: string | null;
  author_name: string;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
}

interface TypeBadge {
  text: string;
  class: string;
  icon: string;
}

// Handle CORS preflight
export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

// GET /api/me - Get current attendee profile
export async function onRequestGet(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const attendee = checkAttendeeAuth(context.request);
    if (!attendee) {
      return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));
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
      return createErrorResponse(errors.notFound('Attendee', requestId));
    }

    const attendeeData = results[0] as unknown as AttendeeRow;

    // Get group members if attendee is in a group
    let members: Array<{ name: string; ref_number: string; payment_due: number; email: string | null }> = [];
    let groupFinancial: { totalOutstanding: number; membersWithPayments: number; totalMembers: number } | null = null;

    if (attendeeData.group_id) {
      const { results: memberResults } = await context.env.DB.prepare(`
        SELECT name, ref_number, payment_due, email
        FROM attendees
        WHERE group_id = ? AND ref_number != ?
        ORDER BY name
      `).bind(attendeeData.group_id, ref).all();

      members = (memberResults as unknown as MemberRow[]).map(member => ({
        name: member.name,
        ref_number: member.ref_number,
        payment_due: member.payment_due || 0,
        email: member.email
      }));

      // Calculate group financial summary (including current user)
      const allMembers = [
        ...members,
        { name: attendeeData.name, payment_due: attendeeData.payment_due || 0 }
      ];

      const totalOutstanding = allMembers.reduce((sum, member) => sum + (member.payment_due || 0), 0);
      const membersWithPayments = allMembers.filter(m => (m.payment_due || 0) > 0).length;

      groupFinancial = {
        totalOutstanding,
        membersWithPayments,
        totalMembers: allMembers.length
      };
    }

    // Get relevant announcements for this attendee
    const announcements = await getAttendeeAnnouncements(context.env.DB, ref, attendeeData.group_id, attendeeData.group_name);

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
        financial: groupFinancial
      } : null,
      announcements: announcements
    };

    return createResponse(response);

  } catch (error) {
    console.error(`[${requestId}] Error in /api/me:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}

/**
 * Get announcements relevant to a specific attendee
 */
async function getAttendeeAnnouncements(
  db: D1Database,
  _ref: string,
  groupId: number | null,
  groupName: string | null
): Promise<Array<{
  id: number;
  title: string;
  content: string;
  type: string;
  priority: number;
  author_name: string;
  created_at: string;
  starts_at: string | null;
  expires_at: string | null;
  is_new: boolean;
  type_badge: TypeBadge;
  priority_badge: TypeBadge;
}>> {
  try {
    const now = new Date().toISOString();

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
    const relevantAnnouncements = (results as unknown as AnnouncementRow[]).filter(announcement => {
      if (announcement.target_audience === 'all') {
        return true;
      }

      if (announcement.target_audience === 'vip') {
        return groupName === 'VIP Group';
      }

      if (announcement.target_audience === 'groups' && announcement.target_groups && groupId) {
        try {
          const targetGroups = JSON.parse(announcement.target_groups) as number[];
          return targetGroups.includes(groupId);
        } catch {
          return false;
        }
      }

      return false;
    });

    // Format announcements for frontend
    const nowTs = Date.now();
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
      is_new: isNewAnnouncement(announcement.created_at, nowTs),
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
function isNewAnnouncement(createdAt: string, nowTs: number): boolean {
  const created = new Date(createdAt).getTime();
  const hoursDiff = (nowTs - created) / (1000 * 60 * 60);
  return hoursDiff <= 24;
}

/**
 * Get type badge configuration
 */
function getTypeBadge(type: string): TypeBadge {
  const badges: Record<string, TypeBadge> = {
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
function getPriorityBadge(priority: number): TypeBadge {
  if (priority >= 4) {
    return { text: 'High Priority', class: 'badge-warning', icon: 'fas fa-exclamation' };
  } else if (priority >= 3) {
    return { text: 'Normal', class: 'badge-secondary', icon: 'fas fa-info' };
  } else {
    return { text: 'Low Priority', class: 'badge-secondary', icon: 'fas fa-info' };
  }
}
