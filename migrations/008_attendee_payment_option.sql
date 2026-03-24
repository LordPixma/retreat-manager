-- Add payment_option column to attendees table
-- Tracks whether attendee chose full payment, installments, or sponsorship
ALTER TABLE attendees ADD COLUMN payment_option TEXT DEFAULT 'full';

-- Backfill from registrations where possible (match by email)
UPDATE attendees
SET payment_option = (
  SELECT r.payment_option
  FROM registrations r
  WHERE r.email = attendees.email
    AND r.payment_option IS NOT NULL
    AND r.status = 'approved'
  ORDER BY r.submitted_at DESC
  LIMIT 1
)
WHERE email IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM registrations r
    WHERE r.email = attendees.email
      AND r.payment_option IS NOT NULL
      AND r.status = 'approved'
  );
