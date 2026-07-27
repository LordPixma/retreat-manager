// GET /api/admin/activity-teams/breakdown
//
// Per-team demographic breakdown powering the admin "Team Balance" heatmap:
// age bands (from date_of_birth), gender split (from the optional gender
// column), and pastoral flags (dietary / medical / accessibility / checked-in),
// plus the full member roster per team. Teams with zero members are included
// with empty counts.
//
// Static route file — takes precedence over the sibling [id].ts dynamic route
// for the literal path /activity-teams/breakdown.

import type { PagesContext } from '../../../_shared/types.js';
import { createResponse, checkAdminAuth, handleCORS } from '../../../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../../_shared/errors.js';
import { fetchTeamMemberRows, buildBreakdown } from '../../../_shared/team-demographics.js';

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));
    }

    // All teams first, so empty teams still show up in the balance grid.
    const { results: teamRows } = await context.env.DB.prepare(`
      SELECT t.id, t.name, t.color, t.leader_id, leader.name AS leader_name
      FROM activity_teams t
      LEFT JOIN attendees leader ON t.leader_id = leader.id
      ORDER BY t.name
    `).all();

    const allTeams = (teamRows as Record<string, unknown>[]).map(t => ({
      id: t.id as number,
      name: t.name as string,
      color: (t.color as string | null) ?? null,
      leader_id: (t.leader_id as number | null) ?? null,
      leader_name: (t.leader_name as string | null) ?? null,
    }));

    const { rows, genderAvailable } = await fetchTeamMemberRows(context.env.DB);
    const { teams, totals } = buildBreakdown(allTeams, rows);

    return createResponse({
      teams,
      totals,
      team_count: teams.length,
      gender_available: genderAvailable,
    });

  } catch (error) {
    console.error(`[${requestId}] Error building activity-team breakdown:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
