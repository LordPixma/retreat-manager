// Auto-create groups by last name
// POST /api/admin/groups/auto-create

import type { PagesContext } from '../../../_shared/types.js';
import { createResponse, checkAdminAuth, handleCORS } from '../../../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../../_shared/errors.js';

interface AttendeeRow {
  id: number;
  name: string;
  group_id: number | null;
}

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

export async function onRequestPost(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));
    }

    const db = context.env.DB;

    // Get all non-archived attendees
    const { results: attendees } = await db.prepare(`
      SELECT id, name, group_id FROM attendees
      WHERE is_archived = 0 OR is_archived IS NULL
    `).all();

    const attendeeRows = attendees as unknown as AttendeeRow[];

    // Group attendees by last name
    const lastNameGroups: Record<string, AttendeeRow[]> = {};
    for (const attendee of attendeeRows) {
      const nameParts = attendee.name.trim().split(/\s+/);
      const lastName = nameParts.length > 1
        ? nameParts[nameParts.length - 1]
        : nameParts[0];
      const normalised = lastName.charAt(0).toUpperCase() + lastName.slice(1).toLowerCase();

      if (!lastNameGroups[normalised]) {
        lastNameGroups[normalised] = [];
      }
      lastNameGroups[normalised].push(attendee);
    }

    // Only create groups for last names shared by 2+ attendees
    const familyGroups = Object.entries(lastNameGroups).filter(([, members]) => members.length >= 2);

    let groupsCreated = 0;
    let attendeesAssigned = 0;
    let groupsSkipped = 0;

    for (const [lastName, members] of familyGroups) {
      const groupName = `${lastName} Family`;

      // Check if group already exists
      const { results: existing } = await db.prepare(
        'SELECT id FROM groups WHERE name = ?'
      ).bind(groupName).all();

      let groupId: number;

      if (existing.length > 0) {
        // Use existing group
        groupId = (existing[0] as unknown as { id: number }).id;
        groupsSkipped++;
      } else {
        // Create new group
        const result = await db.prepare(
          'INSERT INTO groups (name) VALUES (?)'
        ).bind(groupName).run();

        if (!result.success) {
          continue;
        }
        groupId = result.meta.last_row_id as number;
        groupsCreated++;
      }

      // Assign attendees who are not already in a group
      for (const attendee of members) {
        if (!attendee.group_id) {
          await db.prepare(
            'UPDATE attendees SET group_id = ? WHERE id = ?'
          ).bind(groupId, attendee.id).run();
          attendeesAssigned++;
        }
      }
    }

    return createResponse({
      message: `Auto-group complete: ${groupsCreated} groups created, ${attendeesAssigned} attendees assigned`,
      groups_created: groupsCreated,
      groups_existing: groupsSkipped,
      attendees_assigned: attendeesAssigned,
      families_found: familyGroups.length,
    });

  } catch (error) {
    console.error(`[${requestId}] Auto-create groups error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
