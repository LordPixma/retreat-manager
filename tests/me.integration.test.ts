import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import { generateAttendeeToken } from '../functions/_shared/auth.js';
import { onRequestGet as me } from '../functions/api/me.js';
import { setupDb, seedAttendee, methodRequest, bearer, ctx } from './helpers/db.js';

async function getMe(ref) {
  const token = await generateAttendeeToken(ref, env.JWT_SECRET);
  const res = await me(ctx(methodRequest('GET', bearer(token))));
  return { status: res.status, json: await res.json() };
}

describe('GET /api/me', () => {
  beforeEach(async () => {
    await setupDb();
  });

  it('returns 401 without a token', async () => {
    const res = await me(ctx(methodRequest('GET')));
    expect(res.status).toBe(401);
  });

  it('returns the attendee profile with room and group', async () => {
    await env.DB.prepare("INSERT INTO rooms (id, number, description) VALUES (5, '214', 'En-suite')").run();
    await env.DB.prepare("INSERT INTO groups (id, name) VALUES (3, 'The Johnson Family')").run();
    await seedAttendee({ ref: 'REF260001', name: 'Sarah Johnson', room_id: 5, group_id: 3 });

    const { status, json } = await getMe('REF260001');
    expect(status).toBe(200);
    expect(json.ref_number).toBe('REF260001');
    expect(json.room).toMatchObject({ number: '214', description: 'En-suite' });
    expect(json.group).toMatchObject({ name: 'The Johnson Family' });
  });

  it('returns activity teams with colour, leader flag, and a flattened member list', async () => {
    const saraId = await seedAttendee({ ref: 'REF260001', name: 'Sarah Johnson' });
    const davidId = await seedAttendee({ ref: 'REF260002', name: 'David Lee' });
    const mikeId = await seedAttendee({ ref: 'REF260003', name: 'Mike Ross' });

    await env.DB.prepare(
      "INSERT INTO activity_teams (id, name, description, color, leader_id) VALUES (1, 'Worship Team', 'Sung worship', '#10b981', ?)"
    ).bind(davidId).run();
    for (const id of [saraId, davidId, mikeId]) {
      await env.DB.prepare('INSERT INTO activity_team_members (team_id, attendee_id) VALUES (1, ?)').bind(id).run();
    }

    const { status, json } = await getMe('REF260001');
    expect(status).toBe(200);
    expect(json.activity_teams).toHaveLength(1);
    const team = json.activity_teams[0];
    expect(team.name).toBe('Worship Team');
    expect(team.color).toBe('#10b981');
    expect(team.leader_name).toBe('David Lee');
    expect(team.is_leader).toBe(false); // Sarah is a member, not the leader
    // Single grouped query returns all three members (sorted).
    expect(team.members).toEqual(['David Lee', 'Mike Ross', 'Sarah Johnson']);
  });

  it('defaults team colour when the column is empty', async () => {
    const saraId = await seedAttendee({ ref: 'REF260001', name: 'Sarah Johnson' });
    await env.DB.prepare("INSERT INTO activity_teams (id, name, color) VALUES (1, 'Kitchen', '')").run();
    await env.DB.prepare('INSERT INTO activity_team_members (team_id, attendee_id) VALUES (1, ?)').bind(saraId).run();
    const { json } = await getMe('REF260001');
    expect(json.activity_teams[0].color).toBe('#8b5cf6');
  });
});
