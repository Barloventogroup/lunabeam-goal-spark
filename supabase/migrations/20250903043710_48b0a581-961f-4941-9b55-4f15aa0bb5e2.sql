-- Update the existing user's profile to mark onboarding as complete
UPDATE profiles 
SET onboarding_complete = true 
WHERE EXISTS (
  SELECT 1 FROM auth.users 
  WHERE auth.users.id = profiles.id 
  AND auth.users.email = 'c_sandrea@yahoo.com'
);