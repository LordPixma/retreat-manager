/* Expand the per-attendee detail set so attendees / leads can keep
   richer info up-to-date from the portal's My Details and Family
   panels. Adds seven optional columns:

     preferred_name        what they want on their badge / called during sessions
     postal_address        multi-line address for mailings, lost items
     medical_conditions    safety-critical for first-aiders, separate from dietary
     accessibility_needs   wheelchair, hearing/sight, mobility - room allocation hints
     tshirt_size           for retreat merch
     arrival_method        car / train / lift_needed / other - pickup coordination
     vehicle_registration  car park management at the venue

   All TEXT, all NULLable. No CHECK constraints on tshirt_size / arrival_method
   since values vary per cohort and constraints would force a schema
   migration just to add a size or method. App-layer guard on free-text
   length already lives in /api/attendee/profile and family edit.

   D1 console safe per the saved-memory rules: no semicolons inside
   comments, no triggers, one ALTER per statement. */

ALTER TABLE attendees ADD COLUMN preferred_name TEXT;
ALTER TABLE attendees ADD COLUMN postal_address TEXT;
ALTER TABLE attendees ADD COLUMN medical_conditions TEXT;
ALTER TABLE attendees ADD COLUMN accessibility_needs TEXT;
ALTER TABLE attendees ADD COLUMN tshirt_size TEXT;
ALTER TABLE attendees ADD COLUMN arrival_method TEXT;
ALTER TABLE attendees ADD COLUMN vehicle_registration TEXT;
