-- Fix: handle empty first_name from raw_user_meta_data and backfill existing blanks
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _first_name text;
BEGIN
  _first_name := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data ->> 'first_name'), ''), 'User');

  INSERT INTO public.profiles (user_id, first_name, onboarding_complete, comm_pref)
  VALUES (NEW.id, _first_name, false, 'text');
  RETURN NEW;
END;
$$;

-- Backfill: set profile.first_name where missing/blank using auth.users metadata
UPDATE public.profiles p
SET first_name = COALESCE(NULLIF(TRIM(au.raw_user_meta_data ->> 'first_name'), ''), 'User')
FROM auth.users au
WHERE p.user_id = au.id
  AND (p.first_name IS NULL OR TRIM(p.first_name) = '');

-- Ensure comm_pref has a sensible default when missing (defensive)
UPDATE public.profiles
SET comm_pref = 'text'
WHERE comm_pref IS NULL;