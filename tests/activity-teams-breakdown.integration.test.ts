import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import { onRequestGet as breakdown } from '../functions/api/admin/activity-teams/breakdown.js';
import { onRequestGet as exportCsv } from '../functions/api/admin/export.js';
import { setupDb, seedAttendee, methodRequest, adminBearer, ctx } from './helpers/db.js';

// DOB helpers that stay in the intended age band regardless of when the suite
// runs (ageFromDateOfBirth measures against "now").
function yearsAgo(n: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - n);
  return d.toISOString().slice(0, 10);
}

async function makeTeam(name: string, color: string, leaderId: number | null): Promise<number> {
  const res = await env.DB.prepare(
    'INSERT INTO activity_teams (name, description, color, leader_id) VALUES (?, ?, ?, ?)'
  ).bind(name, `${name} desc`, color, leaderId).run();
  return res.meta.last_row_id as number;
}
async function addMember(teamId: number, attendeeId: number): Promise<void> {
  await env.DB.prepare('INSERT INTO activity_team_members (team_id, attendee_id) VALUES (?, ?)')
    .bind(teamId, attendeeId).run();
}

describe('GET /api/admin/activity-teams/breakdown', () => {
  let teamId: number;

  beforeEach(async () => {
    await setupDb();

    // A demographically varied team.
    const m1 = await seedAttendee({ ref: 'REF-A1', name: 'Adult Man', gender: 'male', date_of_birth: yearsAgo(40), checked_in: true, dietary_requirements: 'Vegetarian' });
    const m2 = await seedAttendee({ ref: 'REF-A2', name: 'Adult Woman', gender: 'female', date_of_birth: yearsAgo(35), medical_conditions: 'Asthma' });
    const m3 = await seedAttendee({ ref: 'REF-C1', name: 'Child Boy', gender: 'MALE', date_of_birth: yearsAgo(10), dietary_requirements: 'None' });
    const m4 = await seedAttendee({ ref: 'REF-U5', name: 'Little One', gender: 'female', date_of_birth: yearsAgo(2), accessibility_needs: 'Step-free access' });
    const m5 = await seedAttendee({ ref: 'REF-UK', name: 'Mystery Person' }); // no dob, no gender

    teamId = await makeTeam('Kitchen Crew', '#10b981', m1);
    for (const id of [m1, m2, m3, m4, m5]) await addMember(teamId, id);

    // A second, empty team — must still appear with zero counts.
    await makeTeam('Empty Squad', '#3b82f6', null);
  });

  async function callBreakdown() {
    const res = await breakdown(ctx(methodRequest('GET', await adminBearer())));
    return { status: res.status, json: await res.json() as any };
  }

  it('rejects unauthenticated requests', async () => {
    const res = await breakdown(ctx(methodRequest('GET')));
    expect(res.status).toBe(401);
  });

  it('aggregates age bands, gender, and flags per team', async () => {
    const { status, json } = await callBreakdown();
    expect(status).toBe(200);
    expect(json.gender_available).toBe(true);
    expect(json.team_count).toBe(2);

    const team = json.teams.find((t: any) => t.id === teamId);
    expect(team.member_count).toBe(5);
    expect(team.leader_name).toBe('Adult Man');

    // Age bands.
    expect(team.age).toEqual({ adult: 2, child: 1, under5: 1, unknown: 1 });
    // Gender (note 'MALE' normalises to male; the no-gender member is unknown).
    expect(team.gender).toEqual({ male: 2, female: 2, unknown: 1 });
    // Flags — dietary "None" must NOT count as a real dietary need.
    expect(team.flags).toEqual({ dietary: 1, medical: 1, accessibility: 1, checked_in: 1 });

    // Roster is present and typed.
    expect(team.members).toHaveLength(5);
    const boy = team.members.find((m: any) => m.ref_number === 'REF-C1');
    expect(boy.age_band).toBe('child');
    expect(boy.gender).toBe('male');
    expect(boy.dietary).toBe(false); // "None"
  });

  it('includes empty teams with zero counts', async () => {
    const { json } = await callBreakdown();
    const empty = json.teams.find((t: any) => t.name === 'Empty Squad');
    expect(empty.member_count).toBe(0);
    expect(empty.members).toHaveLength(0);
    expect(empty.age).toEqual({ adult: 0, child: 0, under5: 0, unknown: 0 });
  });

  it('totals sum across all teams', async () => {
    const { json } = await callBreakdown();
    expect(json.totals.member_count).toBe(5);
    expect(json.totals.gender.male).toBe(2);
    expect(json.totals.age.adult).toBe(2);
  });

  it('exports the teams roster as CSV', async () => {
    const req = new Request('https://test.local/api/admin/export?type=activity-teams', {
      method: 'GET',
      headers: await adminBearer(),
    });
    const res = await exportCsv(ctx(req));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/csv');

    const csv = await res.text();
    const [header, ...lines] = csv.trim().split('\n');
    expect(header).toContain('Team');
    expect(header).toContain('Gender');
    expect(header).toContain('Age Band');
    // 5 membership rows (empty team contributes none).
    expect(lines).toHaveLength(5);
    expect(csv).toContain('Kitchen Crew');
    expect(csv).toContain('Adult Man');
    expect(csv).toContain('Vegetarian');
  });
});
