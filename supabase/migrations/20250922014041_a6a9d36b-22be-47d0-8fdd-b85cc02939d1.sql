-- First, let's just drop the old constraint without adding a new one yet
ALTER TABLE goals DROP CONSTRAINT IF EXISTS goals_domain_check;

-- Update all existing domain values to match what we want
UPDATE goals SET domain = 'education' WHERE domain = 'school';
UPDATE goals SET domain = 'employment' WHERE domain = 'work';  
UPDATE goals SET domain = 'independent_living' WHERE domain = 'life';