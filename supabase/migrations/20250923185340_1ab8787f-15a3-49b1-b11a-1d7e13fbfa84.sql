-- Fix duplicate supporter creation in provision_individual_direct
CREATE OR REPLACE FUNCTION public.provision_individual_direct(
  p_first_name text,
  p_strengths text[] DEFAULT ARRAY[]::text[],
  p_interests text[] DEFAULT ARRAY[]::text[],
  p_comm_pref text DEFAULT 'text'::text
)
RETURNS TABLE(individual_id uuid, placeholder_email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _current_user uuid := auth.uid();
  _new_individual_id uuid;
  _placeholder_email text;
  _temp_password text;
BEGIN
  IF _current_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Generate unique ID and credentials
  _new_individual_id := gen_random_uuid();
  _temp_password := 'TempPass' || substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8);
  _placeholder_email := 'temp-' || replace(_new_individual_id::text, '-', '') || '@pending.lunabeam.com';

  -- Create the auth.users record (just like normal signup)
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data,
    role,
    aud
  ) VALUES (
    _new_individual_id,
    '00000000-0000-0000-0000-000000000000',
    _placeholder_email,
    extensions.crypt(_temp_password, extensions.gen_salt('bf')),
    now(),
    now(),
    now(),
    json_build_object('first_name', p_first_name, 'temp_account', true, 'strengths', p_strengths, 'interests', p_interests, 'comm_pref', p_comm_pref, 'created_by_supporter', _current_user)::jsonb,
    'authenticated',
    'authenticated'
  );

  -- The handle_new_user() trigger will create the profile automatically
  -- Just update it with the additional data
  UPDATE public.profiles SET
    strengths = p_strengths,
    interests = p_interests,
    comm_pref = p_comm_pref,
    created_by_supporter = _current_user,
    account_status = 'active',
    authentication_status = 'pending',
    password_set = false
  WHERE user_id = _new_individual_id;

  -- Create supporter relationship with ON CONFLICT to prevent duplicates
  INSERT INTO public.supporters (
    individual_id,
    supporter_id,
    role,
    permission_level,
    is_admin,
    is_provisioner
  ) VALUES (
    _new_individual_id,
    _current_user,
    'supporter',
    'admin',
    true,
    true
  ) ON CONFLICT (individual_id, supporter_id) DO NOTHING;

  -- Return results using RETURN QUERY
  RETURN QUERY SELECT _new_individual_id, _placeholder_email;
END;
$$;