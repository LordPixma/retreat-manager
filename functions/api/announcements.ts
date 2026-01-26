// Public announcements endpoint for attendees with TypeScript

import type { PagesContext } from '../_shared/types.js';
import { createResponse, checkAttendeeAuth, handleCORS } from '../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../_shared/errors.js';

interface AttendeeInfoRow {
  group_id: number | null;
  group_name: string | null;
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

// Handle CORS preflight
export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

// GET /api/announcements - Get announcements for current attendee
export async function onRequestGet(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const attendee = await checkAttendeeAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!attendee) {
      return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));
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

    const userGroupId = (attendeeInfo[0] as unknown as AttendeeInfoRow | undefined)?.group_id;
    const userGroupName = (attendeeInfo[0] as unknown as AttendeeInfoRow | undefined)?.group_name;

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
    const relevantAnnouncements = (results as unknown as AnnouncementRow[]).filter(announcement => {
      if (announcement.target_audience === 'groups' && announcement.target_groups) {
        try {
          const targetGroups = JSON.parse(announcement.target_groups) as number[];
          return userGroupId && targetGroups.includes(userGroupId);
        } catch {
          return false;
        }
      }
      return true;
    });

    // Format announcements for frontend
    const nowTs = Date.now();
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
      is_new: isNewAnnouncement(announcement.created_at, nowTs)
    }));

    return createResponse({
      announcements: formattedAnnouncements,
      user_group: userGroupName || null,
      total_count: formattedAnnouncements.length
    });

  } catch (error) {
    console.error(`[${requestId}] Error fetching announcements for attendee:`, error);
    return createErrorResponse(handleError(error, requestId));
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
