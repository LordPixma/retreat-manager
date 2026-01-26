-- Add family registration columns to registrations table
-- family_members: JSON array of family member details
-- total_amount: calculated total cost
-- member_count: number of family members

ALTER TABLE registrations ADD COLUMN family_members TEXT;
ALTER TABLE registrations ADD COLUMN total_amount INTEGER DEFAULT 200;
ALTER TABLE registrations ADD COLUMN member_count INTEGER DEFAULT 1;
