-- Update Carlos's profile to mark onboarding as complete
UPDATE profiles 
SET onboarding_complete = true, updated_at = now()
WHERE user_id = 'dd8ba4d8-b266-4969-ba5a-4febabe438de';