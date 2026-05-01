// Best-effort split of a single "Full Name" string into first/last parts.
// Mirrors the SQL backfill in migration 012: first whitespace run separates
// first_name from the remainder. If there is no whitespace, the whole string
// is the first name and last is null.
export function splitFullName(full: string | null | undefined): { first: string | null; last: string | null } {
  if (!full) return { first: null, last: null };
  const trimmed = full.trim();
  if (!trimmed) return { first: null, last: null };
  const idx = trimmed.search(/\s/);
  if (idx === -1) return { first: trimmed, last: null };
  return {
    first: trimmed.slice(0, idx),
    last: trimmed.slice(idx + 1).trim() || null,
  };
}

// Compute integer years between a date-of-birth string and a reference date.
// Returns null for empty/unparseable input or future dates.
export function ageFromDateOfBirth(dob: string | null | undefined, asOf: Date = new Date()): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  let age = asOf.getFullYear() - d.getFullYear();
  const m = asOf.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && asOf.getDate() < d.getDate())) age--;
  return age >= 0 ? age : null;
}

// Threshold for "cot/camp-bed eligible" — under-3 covers true babies and
// young toddlers. Older children need a real bed slot in the room. Attendees
// without a date_of_birth are conservatively treated as adults (not cot
// eligible) so we never accidentally over-fill a room.
export const COT_ELIGIBLE_AGE_YEARS = 3;

export function isCotEligible(dob: string | null | undefined, asOf: Date = new Date()): boolean {
  const age = ageFromDateOfBirth(dob, asOf);
  return age !== null && age < COT_ELIGIBLE_AGE_YEARS;
}
