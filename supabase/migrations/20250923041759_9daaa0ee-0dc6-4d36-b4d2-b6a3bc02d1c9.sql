-- Fix handle_new_user function to work without provisional_profiles table

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _first_name text;
BEGIN
  -- For new regular signups, just create a basic profile
  _first_name := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data ->> 'first_name'), ''), 'User');

  INSERT INTO public.profiles (user_id, first_name, onboarding_complete, comm_pref)
  VALUES (NEW.id, _first_name, false, 'text');

  RETURN NEW;
END;
$$;