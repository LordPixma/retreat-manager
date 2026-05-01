// Room occupancy rules.
//
// A room has two capacity dimensions:
//   * `capacity`     — number of real beds (and therefore the maximum number of
//                      attendees who need a bed-slot, i.e. anyone older than
//                      COT_ELIGIBLE_AGE_YEARS or who has no date_of_birth).
//   * `cot_capacity` — additional cot/camp-bed slots reserved for cot-eligible
//                      attendees (under-3s) when bed slots are full.
//
// Allocation example: a 3-bed/1-cot family room can host a 2-adult + 1-older-
// child + 1-baby family — the three bed slots take the adults and older child,
// the baby uses the cot.

import { isCotEligible } from './names.js';

export interface OccupantForCheck {
  date_of_birth?: string | null;
}

export interface RoomCapacity {
  capacity: number;
  cot_capacity: number;
}

export interface AccommodationResult {
  ok: boolean;
  reason?: 'beds_full' | 'cots_full';
  message?: string;
  bedsUsed: number;
  bedsAvailable: number;
  cotsUsed: number;
  cotsAvailable: number;
}

/**
 * Decide whether the proposed set of occupants fits in the room's bed +
 * cot capacity. Cot-eligible occupants prefer cot slots once beds are full;
 * non-cot-eligible occupants always need a bed.
 */
export function canAccommodate(occupants: OccupantForCheck[], room: RoomCapacity): AccommodationResult {
  const cotEligibleCount = occupants.filter(o => isCotEligible(o.date_of_birth)).length;
  const nonCot = occupants.length - cotEligibleCount;

  if (nonCot > room.capacity) {
    return {
      ok: false,
      reason: 'beds_full',
      message: `Need ${nonCot} bed${nonCot === 1 ? '' : 's'} but only ${room.capacity} available`,
      bedsUsed: nonCot,
      bedsAvailable: room.capacity,
      cotsUsed: cotEligibleCount,
      cotsAvailable: room.cot_capacity,
    };
  }

  // Cot-eligible occupants take real beds first when there's room, only
  // spilling into cots when beds are exhausted.
  const remainingBeds = room.capacity - nonCot;
  const cotsNeeded = Math.max(0, cotEligibleCount - remainingBeds);

  if (cotsNeeded > room.cot_capacity) {
    return {
      ok: false,
      reason: 'cots_full',
      message: `Need ${cotsNeeded} cot${cotsNeeded === 1 ? '' : 's'} but only ${room.cot_capacity} available`,
      bedsUsed: room.capacity,
      bedsAvailable: room.capacity,
      cotsUsed: cotsNeeded,
      cotsAvailable: room.cot_capacity,
    };
  }

  return {
    ok: true,
    bedsUsed: nonCot + Math.min(cotEligibleCount, remainingBeds),
    bedsAvailable: room.capacity,
    cotsUsed: cotsNeeded,
    cotsAvailable: room.cot_capacity,
  };
}
