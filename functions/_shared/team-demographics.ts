// Shared demographics helpers for the Activity Teams balance views (the admin
// heatmap and the CSV export). Centralises three things so both endpoints agree
// exactly: the age-band thresholds, the gender normalisation, and the
// defensive member query that works whether or not the optional `gender`
// column (migration 031) has been applied yet.

import type { D1Database } from '@cloudflare/workers-types';
import { ageFromDateOfBirth } from './names.js';

// Age bands derived from date_of_birth. Kept deliberately coarse and standard
// so the balance read is meaningful to a room/pastoral planner:
//   under5 : 0–4   (need close supervision / cots / different sleeping)
//   child  : 5–17
//   adult  : 18+
//   unknown: no usable date_of_birth on file
export type AgeBand = 'adult' | 'child' | 'under5' | 'unknown';

export function ageBand(dob: string | null | undefined, asOf?: Date): AgeBand {
  const age = ageFromDateOfBirth(dob, asOf);
  if (age === null) return 'unknown';
  if (age < 5) return 'under5';
  if (age < 18) return 'child';
  return 'adult';
}

export const AGE_BAND_LABELS: Record<AgeBand, string> = {
  adult: 'Adult (18+)',
  child: 'Child (5–17)',
  under5: 'Under 5',
  unknown: 'Age unknown',
};

// Gender is stored lower-case; anything else (including NULL) is "unknown".
export type Gender = 'male' | 'female' | 'unknown';

export function normaliseGender(g: unknown): Gender {
  if (typeof g !== 'string') return 'unknown';
  const v = g.trim().toLowerCase();
  if (v === 'male' || v === 'm') return 'male';
  if (v === 'female' || v === 'f') return 'female';
  return 'unknown';
}

// One row per (team, member). Team meta is repeated on each row so callers can
// group in JS without a second round-trip.
export interface TeamMemberRow {
  team_id: number;
  team_name: string;
  team_color: string | null;
  leader_id: number | null;
  leader_name: string | null;
  attendee_id: number;
  name: string;
  ref_number: string;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  dietary_requirements: string | null;
  medical_conditions: string | null;
  accessibility_needs: string | null;
  checked_in: number | null;
  group_name: string | null;
}

// Fetch every team membership with the attendee attributes the balance views
// need. Falls back gracefully if the `gender` column hasn't been migrated yet:
// on a "no such column" error we re-run selecting NULL AS gender and report
// genderAvailable = false so the UI can explain the empty split.
export async function fetchTeamMemberRows(
  DB: D1Database
): Promise<{ rows: TeamMemberRow[]; genderAvailable: boolean }> {
  const base = (genderExpr: string) => `
    SELECT
      t.id            AS team_id,
      t.name          AS team_name,
      t.color         AS team_color,
      t.leader_id     AS leader_id,
      leader.name     AS leader_name,
      a.id            AS attendee_id,
      a.name          AS name,
      a.ref_number    AS ref_number,
      a.email         AS email,
      a.phone         AS phone,
      a.date_of_birth AS date_of_birth,
      ${genderExpr}   AS gender,
      a.dietary_requirements AS dietary_requirements,
      a.medical_conditions   AS medical_conditions,
      a.accessibility_needs  AS accessibility_needs,
      a.checked_in    AS checked_in,
      g.name          AS group_name
    FROM activity_team_members m
    JOIN activity_teams t ON m.team_id = t.id
    JOIN attendees a ON m.attendee_id = a.id
    LEFT JOIN attendees leader ON t.leader_id = leader.id
    LEFT JOIN groups g ON a.group_id = g.id
    ORDER BY t.name, a.name
  `;

  try {
    const { results } = await DB.prepare(base('a.gender')).all();
    return { rows: results as unknown as TeamMemberRow[], genderAvailable: true };
  } catch (err) {
    // Most likely: gender column not migrated yet. Retry without it rather than
    // failing the whole balance view.
    if (/no such column|gender/i.test(String((err as Error)?.message))) {
      const { results } = await DB.prepare(base('NULL')).all();
      return { rows: results as unknown as TeamMemberRow[], genderAvailable: false };
    }
    throw err;
  }
}

export interface TeamBreakdown {
  id: number;
  name: string;
  color: string;
  leader_id: number | null;
  leader_name: string | null;
  member_count: number;
  age: Record<AgeBand, number>;
  gender: Record<Gender, number>;
  flags: { dietary: number; medical: number; accessibility: number; checked_in: number };
  members: Array<{
    id: number;
    name: string;
    ref_number: string;
    age: number | null;
    age_band: AgeBand;
    gender: Gender;
    dietary: boolean;
    medical: boolean;
    accessibility: boolean;
    checked_in: boolean;
    group_name: string | null;
  }>;
}

const DEFAULT_TEAM_COLOR = '#8b5cf6';

function emptyAge(): Record<AgeBand, number> {
  return { adult: 0, child: 0, under5: 0, unknown: 0 };
}
function emptyGender(): Record<Gender, number> {
  return { male: 0, female: 0, unknown: 0 };
}

const hasText = (v: string | null | undefined): boolean =>
  typeof v === 'string' && v.trim() !== '' && v.trim().toLowerCase() !== 'none';

// Group the flat rows into per-team breakdowns plus an all-teams totals block.
// `allTeams` (id/name/color/leader) is passed in so teams with zero members
// still appear with empty counts rather than vanishing from the view.
export function buildBreakdown(
  allTeams: Array<{ id: number; name: string; color: string | null; leader_id: number | null; leader_name: string | null }>,
  rows: TeamMemberRow[],
  asOf?: Date
): { teams: TeamBreakdown[]; totals: Omit<TeamBreakdown, 'members' | 'id' | 'name' | 'color' | 'leader_id' | 'leader_name'> } {
  const byTeam = new Map<number, TeamBreakdown>();

  for (const t of allTeams) {
    byTeam.set(t.id, {
      id: t.id,
      name: t.name,
      color: t.color || DEFAULT_TEAM_COLOR,
      leader_id: t.leader_id,
      leader_name: t.leader_name,
      member_count: 0,
      age: emptyAge(),
      gender: emptyGender(),
      flags: { dietary: 0, medical: 0, accessibility: 0, checked_in: 0 },
      members: [],
    });
  }

  const totals = {
    member_count: 0,
    age: emptyAge(),
    gender: emptyGender(),
    flags: { dietary: 0, medical: 0, accessibility: 0, checked_in: 0 },
  };

  for (const r of rows) {
    let team = byTeam.get(r.team_id);
    if (!team) {
      // Team not in allTeams (shouldn't happen) — synthesise it defensively.
      team = {
        id: r.team_id, name: r.team_name, color: r.team_color || DEFAULT_TEAM_COLOR,
        leader_id: r.leader_id, leader_name: r.leader_name, member_count: 0,
        age: emptyAge(), gender: emptyGender(),
        flags: { dietary: 0, medical: 0, accessibility: 0, checked_in: 0 }, members: [],
      };
      byTeam.set(r.team_id, team);
    }

    const band = ageBand(r.date_of_birth, asOf);
    const gender = normaliseGender(r.gender);
    const dietary = hasText(r.dietary_requirements);
    const medical = hasText(r.medical_conditions);
    const accessibility = hasText(r.accessibility_needs);
    const checkedIn = !!r.checked_in;

    team.member_count++;
    team.age[band]++;
    team.gender[gender]++;
    if (dietary) team.flags.dietary++;
    if (medical) team.flags.medical++;
    if (accessibility) team.flags.accessibility++;
    if (checkedIn) team.flags.checked_in++;

    totals.member_count++;
    totals.age[band]++;
    totals.gender[gender]++;
    if (dietary) totals.flags.dietary++;
    if (medical) totals.flags.medical++;
    if (accessibility) totals.flags.accessibility++;
    if (checkedIn) totals.flags.checked_in++;

    team.members.push({
      id: r.attendee_id,
      name: r.name,
      ref_number: r.ref_number,
      age: ageFromDateOfBirth(r.date_of_birth, asOf),
      age_band: band,
      gender,
      dietary,
      medical,
      accessibility,
      checked_in: checkedIn,
      group_name: r.group_name,
    });
  }

  const teams = Array.from(byTeam.values()).sort((a, b) => a.name.localeCompare(b.name));
  return { teams, totals };
}
