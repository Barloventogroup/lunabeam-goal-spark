-- Update the goals domain constraint to allow proper domain values
ALTER TABLE goals DROP CONSTRAINT IF EXISTS goals_domain_check;

-- Add the new constraint with the correct domain values
ALTER TABLE goals ADD CONSTRAINT goals_domain_check 
CHECK (domain IN ('education', 'employment', 'independent_living', 'health', 'social_skills', 'postsecondary', 'fun_recreation', 'other'));