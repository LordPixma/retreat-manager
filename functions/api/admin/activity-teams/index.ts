import type { PagesContext } from '../../../_shared/types.js';
import { createResponse, checkAdminAuth, handleCORS } from '../../../_shared/auth.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../../_shared/errors.js';
import { sendEmailsBulk, type OutboundEmail } from '../../../_shared/email.js';

interface TeamRow {
  id: number;
  name: string;
  description: string | null;
  leader_id: number | null;
  leader_name: string | null;
  member_count: number;
  member_names: string | null;
  member_ids: string | null;
  created_at: string;
}

export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

// GET /api/admin/activity-teams
export async function onRequestGet(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));
    }

    const { results } = await context.env.DB.prepare(`
      SELECT
        t.id, t.name, t.description, t.leader_id, t.created_at,
        leader.name AS leader_name,
        COUNT(m.id) AS member_count,
        GROUP_CONCAT(a.name, ', ') AS member_names,
        GROUP_CONCAT(a.id) AS member_ids
      FROM activity_teams t
      LEFT JOIN attendees leader ON t.leader_id = leader.id
      LEFT JOIN activity_team_members m ON t.id = m.team_id
      LEFT JOIN attendees a ON m.attendee_id = a.id
      GROUP BY t.id
      ORDER BY t.name
    `).all();

    const teams = (results as unknown as TeamRow[]).map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      leader_id: t.leader_id,
      leader_name: t.leader_name,
      member_count: t.member_count,
      members: t.member_names ? t.member_names.split(', ') : [],
      member_ids: t.member_ids ? t.member_ids.split(',').map(Number) : [],
      created_at: t.created_at,
    }));

    return createResponse({ data: teams });

  } catch (error) {
    console.error(`[${requestId}] Error fetching activity teams:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}

// POST /api/admin/activity-teams
export async function onRequestPost(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const admin = await checkAdminAuth(context.request, context.env.JWT_SECRET || context.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));
    }

    const body = await context.request.json() as {
      name: string;
      description?: string;
      leader_id?: number;
      member_ids?: number[];
    };

    if (!body.name || body.name.trim() === '') {
      return createErrorResponse(errors.badRequest('Team name is required', requestId));
    }

    // Check uniqueness
    const { results: existing } = await context.env.DB.prepare(
      'SELECT id FROM activity_teams WHERE name = ?'
    ).bind(body.name.trim()).all();

    if (existing.length > 0) {
      return createErrorResponse(errors.conflict('A team with this name already exists', requestId));
    }

    // Create team
    const result = await context.env.DB.prepare(`
      INSERT INTO activity_teams (name, description, leader_id)
      VALUES (?, ?, ?)
    `).bind(
      body.name.trim(),
      body.description?.trim() || null,
      body.leader_id || null
    ).run();

    const teamId = result.meta.last_row_id;

    // Add members
    const memberIds = body.member_ids || [];
    // Ensure leader is also a member
    if (body.leader_id && !memberIds.includes(body.leader_id)) {
      memberIds.push(body.leader_id);
    }

    for (const attendeeId of memberIds) {
      await context.env.DB.prepare(
        'INSERT OR IGNORE INTO activity_team_members (team_id, attendee_id) VALUES (?, ?)'
      ).bind(teamId, attendeeId).run();
    }

    // Send notification emails to all members
    const emailPromise = sendTeamNotificationEmails(
      context.env, body.name.trim(), body.description?.trim() || '', memberIds, body.leader_id || null, requestId
    ).catch(err => console.error(`[${requestId}] Email notification error:`, err));

    context.waitUntil(emailPromise);

    return createResponse({ id: teamId, message: 'Activity team created successfully' }, 201);

  } catch (error) {
    console.error(`[${requestId}] Error creating activity team:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}

async function sendTeamNotificationEmails(
  env: PagesContext['env'],
  teamName: string,
  description: string,
  memberIds: number[],
  leaderId: number | null,
  requestId: string
): Promise<void> {
  if (!env.EMAIL || !env.FROM_EMAIL || memberIds.length === 0) return;

  const retreatName = env.RETREAT_NAME || 'Growth and Wisdom Retreat';

  // Get member details
  const placeholders = memberIds.map(() => '?').join(',');
  const { results } = await env.DB.prepare(
    `SELECT id, name, email FROM attendees WHERE id IN (${placeholders})`
  ).bind(...memberIds).all();

  // Get leader name
  let leaderName = 'Not assigned';
  if (leaderId) {
    const { results: leaderRows } = await env.DB.prepare(
      'SELECT name FROM attendees WHERE id = ?'
    ).bind(leaderId).all();
    if (leaderRows.length > 0) leaderName = (leaderRows[0] as { name: string }).name;
  }

  const memberRows = results as { id: number; name: string; email: string | null }[];
  const memberNames = memberRows.map(r => r.name);
  const recipients = memberRows.filter(m => m.email);

  const messages: OutboundEmail[] = recipients.map(member => ({
    to: member.email!,
    subject: `You've been added to ${teamName} - ${retreatName}`,
    html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
                <h1 style="color: white; margin: 0;">Activity Team Assignment</h1>
              </div>
              <div style="padding: 30px; background: #f8fafc; border-radius: 0 0 12px 12px;">
                <p>Dear ${member.name},</p>
                <p>You have been added to an activity team for the <strong>${retreatName}</strong>!</p>
                <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
                  <p style="margin: 0 0 8px;"><strong>Team:</strong> ${teamName}</p>
                  ${description ? `<p style="margin: 0 0 8px;"><strong>Description:</strong> ${description}</p>` : ''}
                  <p style="margin: 0 0 8px;"><strong>Team Leader:</strong> ${leaderName}</p>
                  <p style="margin: 0;"><strong>Team Members:</strong> ${memberNames.join(', ')}</p>
                </div>
                ${member.id === leaderId ? '<p style="color: #667eea; font-weight: 600;">You have been designated as the Team Leader!</p>' : ''}
                <p>We look forward to a wonderful retreat experience together!</p>
                <p style="color: #6b7280; font-size: 0.85rem;">— The ${retreatName} Team</p>
              </div>
            </div>
          `,
  }));
  const keys = recipients.map(m => m.id);

  const result = await sendEmailsBulk(env, messages, keys);
  console.log(`[${requestId}] Team notifications: ${result.sentKeys.length} sent, ${result.failedKeys.length} failed`);
}

export { sendTeamNotificationEmails };
