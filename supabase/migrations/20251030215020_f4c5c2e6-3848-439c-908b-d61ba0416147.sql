-- Fix handle_new_user to include email and backfill missing emails

-- Update the trigger function to copy email from auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Check if this is a claimed account (has claim token in metadata)
  IF NEW.raw_user_meta_data ? 'claim_token' OR NEW.raw_user_meta_data ? 'magic_link_token' THEN
    -- This is a claimed account - needs password setup
    INSERT INTO public.profiles (
      user_id, 
      first_name,
      email,
      comm_pref,
      password_set, 
      authentication_status, 
      account_status,
      user_type,
      onboarding_complete
    )
    VALUES (
      NEW.id, 
      COALESCE(NEW.raw_user_meta_data ->> 'first_name', 'User'),
      NEW.email,  -- Copy email from auth.users
      'text',
      false,
      'pending',
      'user_claimed',
      'individual',
      false
    );
  ELSE
    -- This is a regular signup - password already set during signup
    INSERT INTO public.profiles (
      user_id, 
      first_name,
      email,
      comm_pref,
      password_set, 
      authentication_status, 
      account_status,
      user_type,
      onboarding_complete
    )
    VALUES (
      NEW.id, 
      COALESCE(NEW.raw_user_meta_data ->> 'first_name', 'User'),
      NEW.email,  -- Copy email from auth.users
      'text',
      true,
      'authenticated',
      'active',
      'individual',
      false
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Backfill missing emails for existing profiles
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.user_id = u.id 
  AND (p.email IS NULL OR p.email = '')
  AND u.email IS NOT NULL;