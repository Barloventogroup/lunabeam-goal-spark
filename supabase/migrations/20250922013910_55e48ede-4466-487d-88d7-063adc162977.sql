-- First, update existing domain values to match the new constraint
UPDATE goals SET domain = 'education' WHERE domain = 'school';
UPDATE goals SET domain = 'employment' WHERE domain = 'work';
UPDATE goals SET domain = 'independent_living' WHERE domain = 'life';
-- health stays the same
-- other stays the same

-- Now drop the old constraint
ALTER TABLE goals DROP CONSTRAINT IF EXISTS goals_domain_check;

-- Add the new constraint with the correct domain values
ALTER TABLE goals ADD CONSTRAINT goals_domain_check 
CHECK (domain IN ('education', 'employment', 'independent_living', 'health', 'social_skills', 'postsecondary', 'fun_recreation', 'other'));