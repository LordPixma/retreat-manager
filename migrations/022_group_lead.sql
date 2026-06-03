/* Group lead flag on attendees.

   Admin assigns one attendee per group as the family lead. The lead
   gets edit access to other members' contact info, dietary, allergies,
   and display name from the attendee portal. Family-pay is unchanged
   any member can initiate it.

   Stored as a per-attendee boolean rather than groups.lead_attendee_id
   to keep this migration ALTER-only (a new column on attendees, no
   table recreate). The single-lead-per-group invariant is enforced in
   application code in the admin endpoint that sets the flag.

   Per the D1 console parser note (D1 splits on semicolons inside
   comments and trigger bodies), this file is comment-safe and has no
   triggers needing isolated paste. */

ALTER TABLE attendees ADD COLUMN is_group_lead INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_attendees_group_lead ON attendees(group_id, is_group_lead);
