// GET /api/attendee/export
//
// Self-service data export (UK GDPR "right of access"). Returns everything the
// portal holds about the signed-in attendee as JSON — profile, room/group,
// activity teams, and their own community posts. The frontend turns this into
// a downloadable file.

import type { PagesContext } from '../../_shared/types.js';
import { checkAttendeeAuth, handleCORS } from '../../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../_shared/errors.js';

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();
  try {
    const auth = await checkAttendeeAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!auth) return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));

    const { results: attRows } = await context.env.DB.prepare(`
      SELECT a.*, r.number AS room_number, r.description AS room_description, g.name AS group_name
      FROM attendees a
      LEFT JOIN rooms r ON a.room_id = r.id
      LEFT JOIN groups g ON a.group_id = g.id
      WHERE a.ref_number = ?
    `).bind(auth.ref).all();

    if (!attRows.length) return createErrorResponse(errors.notFound('Attendee', requestId));
    const att = attRows[0] as Record<string, unknown>;

    // Never include the password hash in an export.
    delete att.password_hash;

    // Activity teams the attendee belongs to.
    const { results: teams } = await context.env.DB.prepare(`
      SELECT t.name, t.description
      FROM activity_team_members m
      JOIN activity_teams t ON m.team_id = t.id
      WHERE m.attendee_id = ?
      ORDER BY t.name
    `).bind(att.id).all();

    // The attendee's own community posts (best-effort — table may be absent).
    let communityPosts: unknown[] = [];
    try {
      const { results } = await context.env.DB.prepare(
        'SELECT post_type, content, created_at FROM community_posts WHERE attendee_id = ? ORDER BY created_at DESC'
      ).bind(att.id).all();
      communityPosts = results;
    } catch { /* table not migrated yet — omit */ }

    const payload = {
      exported_at: new Date().toISOString(),
      note: 'This is a copy of the personal information the Retreat Portal holds about you.',
      profile: att,
      activity_teams: teams,
      community_posts: communityPosts,
    };

    return new Response(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="retreat-data-${auth.ref}.json"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error(`[${requestId}] attendee export error:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}
