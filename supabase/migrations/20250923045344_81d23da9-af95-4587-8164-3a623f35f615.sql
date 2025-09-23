-- Add the user from onboarding to profiles table
INSERT INTO public.profiles (
  user_id,
  first_name,
  email,
  onboarding_complete,
  comm_pref,
  account_status,
  authentication_status,
  password_set
) VALUES (
  'c2057dd5-2883-42d1-9419-0b5c423cccbe',
  'User',
  'user@example.com',
  false,
  'text',
  'active',
  'pending',
  true
) ON CONFLICT (user_id) DO NOTHING;