// Current user profile endpoint with TypeScript

import type { PagesContext } from '../_shared/types.js';
import { createResponse, checkAttendeeAuth, handleCORS } from '../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../_shared/errors.js';

interface AttendeeRow {
  id: number;
  ref_number: string;
  name: string;
  email: string | null;
  phone: string | null;
  emergency_contact: string | null;
  dietary_requirements: string | null;
  special_requests: string | null;
  payment_due: number;
  payment_option: string | null;
  payment_status: string;
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
    const attendee = await checkAttendeeAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!attendee) {
      return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));
    }

    const ref = attendee.ref;

    // Query attendee data with joins
    const { results } = await context.env.DB.prepare(`
      SELECT
        a.id,
        a.ref_number,
        a.name,
        a.email,
        a.phone,
        a.emergency_contact,
        a.dietary_requirements,
        a.special_requests,
        a.payment_due,
        a.payment_option,
        a.payment_status,
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

    // Get family/registration data if this is a primary attendee (has email)
    let familyRegistration: {
      total_amount: number;
      member_count: number;
      payment_option: string;
      family_members: Array<{ name: string; member_type: string; price: number; date_of_birth?: string; dietary_requirements?: string }>;
      submitted_at: string;
    } | null = null;

    if (attendeeData.email) {
      const { results: regRows } = await context.env.DB.prepare(`
        SELECT family_members, total_amount, member_count, payment_option, submitted_at
        FROM registrations
        WHERE email = ? AND status = 'approved'
        ORDER BY submitted_at DESC
        LIMIT 1
      `).bind(attendeeData.email).all();

      if (regRows.length > 0) {
        const reg = regRows[0] as { family_members: string | null; total_amount: number; member_count: number; payment_option: string; submitted_at: string };
        let parsedMembers: Array<{ name: string; member_type: string; price: number; date_of_birth?: string; dietary_requirements?: string }> = [];
        try {
          if (reg.family_members) {
            parsedMembers = JSON.parse(reg.family_members);
          }
        } catch { /* ignore parse errors */ }

        familyRegistration = {
          total_amount: reg.total_amount || 0,
          member_count: reg.member_count || 1,
          payment_option: reg.payment_option || 'full',
          family_members: parsedMembers,
          submitted_at: reg.submitted_at,
        };
      }
    }

    // Get activity teams for this attendee
    const { results: teamRows } = await context.env.DB.prepare(`
      SELECT t.id, t.name, t.description, t.leader_id, leader.name AS leader_name
      FROM activity_team_members m
      JOIN activity_teams t ON m.team_id = t.id
      LEFT JOIN attendees leader ON t.leader_id = leader.id
      WHERE m.attendee_id = ?
    `).bind(attendeeData.id).all();

    let activityTeams: Array<{ name: string; description: string | null; leader_name: string | null; is_leader: boolean; members: string[] }> = [];
    for (const row of teamRows as { id: number; name: string; description: string | null; leader_id: number | null; leader_name: string | null }[]) {
      const { results: teamMembers } = await context.env.DB.prepare(`
        SELECT a.name FROM activity_team_members m JOIN attendees a ON m.attendee_id = a.id WHERE m.team_id = ? ORDER BY a.name
      `).bind(row.id).all();
      activityTeams.push({
        name: row.name,
        description: row.description,
        leader_name: row.leader_name,
        is_leader: row.leader_id === attendeeData.id,
        members: (teamMembers as { name: string }[]).map(m => m.name),
      });
    }

    // Format response
    const response = {
      ref_number: ref,
      name: attendeeData.name,
      email: attendeeData.email,
      phone: attendeeData.phone,
      emergency_contact: attendeeData.emergency_contact,
      dietary_requirements: attendeeData.dietary_requirements,
      special_requests: attendeeData.special_requests,
      payment_due: attendeeData.payment_due || 0,
      payment_option: attendeeData.payment_option || 'full',
      payment_status: attendeeData.payment_status || 'pending',
      room: attendeeData.room_number ? {
        number: attendeeData.room_number,
        description: attendeeData.room_description || ''
      } : null,
      group: attendeeData.group_name ? {
        name: attendeeData.group_name,
        members: members,
        financial: groupFinancial
      } : null,
      activity_teams: activityTeams,
      family_registration: familyRegistration,
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
