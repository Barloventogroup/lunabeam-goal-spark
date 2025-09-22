-- Drop the old constraint first
ALTER TABLE goals DROP CONSTRAINT IF EXISTS goals_domain_check;

-- Expand the domain column to accommodate longer names
ALTER TABLE goals ALTER COLUMN domain TYPE VARCHAR(20);

-- Update existing domain values to match what we want
UPDATE goals SET domain = 'education' WHERE domain = 'school';
UPDATE goals SET domain = 'employment' WHERE domain = 'work';  
UPDATE goals SET domain = 'independent_living' WHERE domain = 'life';

-- Now add the new constraint with the correct domain values
ALTER TABLE goals ADD CONSTRAINT goals_domain_check 
CHECK (domain IN ('education', 'employment', 'independent_living', 'health', 'social_skills', 'postsecondary', 'fun_recreation', 'other'));