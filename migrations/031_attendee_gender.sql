-- Optional gender on attendees, powering the Activity Teams balance heatmap
-- (Male vs Female split per team) and the team CSV export.
--
-- Gender was never captured at registration, so this column is nullable and
-- back-fills to NULL for every existing attendee. Admins set it per person in
-- the attendee edit modal; anyone left NULL simply shows as "Unknown" in the
-- balance views. Stored lower-case ('male' | 'female'); NULL/anything else is
-- treated as unknown by the aggregation code.
--
-- Additive and safe to run on a live DB. The reading endpoints
-- (activity-teams/breakdown, admin/export) and the attendee update handler all
-- degrade gracefully if this column is missing, so code and migration can land
-- in either order.

ALTER TABLE attendees ADD COLUMN gender TEXT;
