import type { PagesContext } from '../../../_shared/types.js';
import { createResponse, checkAdminAuth, handleCORS } from '../../../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../../_shared/errors.js';

interface IdParams {
  id: string;
}

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

// GET /api/admin/activity-teams/:id
export async function onRequestGet(context: PagesContext<IdParams>): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));
    }

    const id = context.params.id;

    const { results: teamRows } = await context.env.DB.prepare(`
      SELECT t.*, leader.name AS leader_name
      FROM activity_teams t
      LEFT JOIN attendees leader ON t.leader_id = leader.id
      WHERE t.id = ?
    `).bind(id).all();

    if (teamRows.length === 0) {
      return createErrorResponse(errors.notFound('Activity team', requestId));
    }

    const team = teamRows[0] as { id: number; name: string; description: string | null; leader_id: number | null; leader_name: string | null; created_at: string };

    // Get members
    const { results: members } = await context.env.DB.prepare(`
      SELECT a.id, a.name, a.email, a.ref_number
      FROM activity_team_members m
      JOIN attendees a ON m.attendee_id = a.id
      WHERE m.team_id = ?
      ORDER BY a.name
    `).bind(id).all();

    return createResponse({
      ...team,
      members,
      member_ids: (members as { id: number }[]).map(m => m.id),
    });

  } catch (error) {
    console.error(`[${requestId}] Error fetching activity team:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}

// PUT /api/admin/activity-teams/:id
export async function onRequestPut(context: PagesContext<IdParams>): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));
    }

    const id = context.params.id;

    // Check exists
    const { results: existing } = await context.env.DB.prepare(
      'SELECT id FROM activity_teams WHERE id = ?'
    ).bind(id).all();

    if (existing.length === 0) {
      return createErrorResponse(errors.notFound('Activity team', requestId));
    }

    const body = await context.request.json() as {
      name?: string;
      description?: string;
      leader_id?: number | null;
      member_ids?: number[];
    };

    // Check name uniqueness if changing
    if (body.name) {
      const { results: nameCheck } = await context.env.DB.prepare(
        'SELECT id FROM activity_teams WHERE name = ? AND id != ?'
      ).bind(body.name.trim(), id).all();

      if (nameCheck.length > 0) {
        return createErrorResponse(errors.conflict('A team with this name already exists', requestId));
      }
    }

    // Update team details
    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    if (body.name !== undefined) { updates.push('name = ?'); values.push(body.name.trim()); }
    if (body.description !== undefined) { updates.push('description = ?'); values.push(body.description?.trim() || null); }
    if (body.leader_id !== undefined) { updates.push('leader_id = ?'); values.push(body.leader_id); }

    if (updates.length > 0) {
      values.push(id);
      await context.env.DB.prepare(
        `UPDATE activity_teams SET ${updates.join(', ')} WHERE id = ?`
      ).bind(...values).run();
    }

    // Update members if provided
    if (body.member_ids !== undefined) {
      // Get current members to detect new additions
      const { results: currentMembers } = await context.env.DB.prepare(
        'SELECT attendee_id FROM activity_team_members WHERE team_id = ?'
      ).bind(id).all();
      const currentIds = new Set((currentMembers as { attendee_id: number }[]).map(m => m.attendee_id));

      const newMemberIds = body.member_ids;
      // Ensure leader is a member
      if (body.leader_id && !newMemberIds.includes(body.leader_id)) {
        newMemberIds.push(body.leader_id);
      }

      // Remove all and re-add
      await context.env.DB.prepare(
        'DELETE FROM activity_team_members WHERE team_id = ?'
      ).bind(id).run();

      for (const attendeeId of newMemberIds) {
        await context.env.DB.prepare(
          'INSERT OR IGNORE INTO activity_team_members (team_id, attendee_id) VALUES (?, ?)'
        ).bind(id, attendeeId).run();
      }

      // Find newly added members
      const addedIds = newMemberIds.filter(mid => !currentIds.has(mid));

      // Send emails only to newly added members
      if (addedIds.length > 0) {
        const teamName = body.name?.trim() || (await context.env.DB.prepare('SELECT name FROM activity_teams WHERE id = ?').bind(id).all()).results[0] as unknown as { name: string };
        const name = typeof teamName === 'string' ? teamName : (teamName as { name: string }).name;

        const { sendTeamNotificationEmails } = await import('./index.js');
        const emailPromise = sendTeamNotificationEmails(
          context.env, parseInt(id), name, body.description?.trim() || '', addedIds, body.leader_id || null, requestId
        ).catch(err => console.error(`[${requestId}] Email error:`, err));

        context.waitUntil(emailPromise);
      }
    }

    return createResponse({ message: 'Activity team updated successfully' });

  } catch (error) {
    console.error(`[${requestId}] Error updating activity team:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}

// DELETE /api/admin/activity-teams/:id
export async function onRequestDelete(context: PagesContext<IdParams>): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));
    }

    const id = context.params.id;

    const { results } = await context.env.DB.prepare(
      'SELECT name FROM activity_teams WHERE id = ?'
    ).bind(id).all();

    if (results.length === 0) {
      return createErrorResponse(errors.notFound('Activity team', requestId));
    }

    // Members cascade-delete via FK
    await context.env.DB.prepare('DELETE FROM activity_teams WHERE id = ?').bind(id).run();

    return createResponse({ message: `Team "${(results[0] as { name: string }).name}" deleted successfully` });

  } catch (error) {
    console.error(`[${requestId}] Error deleting activity team:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
