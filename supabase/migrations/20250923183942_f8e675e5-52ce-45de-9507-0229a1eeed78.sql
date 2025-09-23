-- Fix the ambiguous column reference in provision_individual_direct
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

  -- Create the auth.users record directly
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
    json_build_object('first_name', p_first_name, 'temp_account', true)::jsonb,
    'authenticated',
    'authenticated'
  );

  -- Create profile (will trigger from handle_new_user, but ensure it has the right data)
  INSERT INTO public.profiles (
    user_id,
    first_name,
    email,
    strengths,
    interests,
    comm_pref,
    onboarding_complete,
    account_status,
    authentication_status,
    password_set,
    created_by_supporter
  ) VALUES (
    _new_individual_id,
    COALESCE(NULLIF(TRIM(p_first_name), ''), 'Individual'),
    _placeholder_email,
    p_strengths,
    p_interests,
    p_comm_pref,
    false,
    'active',
    'pending',
    false,
    _current_user
  ) ON CONFLICT (user_id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    strengths = EXCLUDED.strengths,
    interests = EXCLUDED.interests,
    comm_pref = EXCLUDED.comm_pref,
    created_by_supporter = EXCLUDED.created_by_supporter,
    updated_at = now();

  -- Create supporter relationship with explicit column references
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
  ) ON CONFLICT (individual_id, supporter_id) DO UPDATE SET
    role = EXCLUDED.role,
    permission_level = EXCLUDED.permission_level,
    is_admin = EXCLUDED.is_admin,
    is_provisioner = EXCLUDED.is_provisioner;

  -- Return the results
  individual_id := _new_individual_id;
  placeholder_email := _placeholder_email;
  RETURN NEXT;
END;
$$;