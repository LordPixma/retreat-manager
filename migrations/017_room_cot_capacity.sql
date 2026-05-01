-- Add cot/camp-bed capacity to rooms.
--
-- A `family` room with `capacity = 3, cot_capacity = 1` accommodates a family
-- of four where one member is under-3 (the cot/camp-bed user). The allocation
-- guard counts cot-eligible attendees (DOB < 3 years ago) separately and only
-- requires bed-capacity for everyone else.
--
-- Existing rooms default to 0 cot slots — admin can opt-in per family room.

ALTER TABLE rooms ADD COLUMN cot_capacity INTEGER NOT NULL DEFAULT 0;
