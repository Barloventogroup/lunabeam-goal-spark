-- Fix security warnings for functions created in previous migration

-- Update provision_individual_direct function with proper search_path
CREATE OR REPLACE FUNCTION public.provision_individual_direct(
  p_first_name text,
  p_strengths text[] DEFAULT ARRAY[]::text[],
  p_interests text[] DEFAULT ARRAY[]::text[],
  p_comm_pref text DEFAULT 'text'
)
RETURNS TABLE(individual_id uuid, placeholder_email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _current_user uuid := auth.uid();
  _new_individual_id uuid := gen_random_uuid();
  _placeholder_email text;
  _temp_password text := 'TempPass' || substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8);
BEGIN
  IF _current_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Generate placeholder email
  _placeholder_email := 'temp-' || replace(_new_individual_id::text, '-', '') || '@pending.lunabeam.com';

  -- Insert into auth.users using service role privileges
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
    crypt(_temp_password, gen_salt('bf')),
    now(), -- Auto-confirm placeholder email
    now(),
    now(),
    json_build_object('first_name', p_first_name, 'temp_account', true)::jsonb,
    'authenticated',
    'authenticated'
  );

  -- Create profile for the individual
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
    'pending_email_assignment',
    'placeholder',
    false,
    _current_user
  );

  -- Create supporter relationship
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
  );

  individual_id := _new_individual_id;
  placeholder_email := _placeholder_email;
  RETURN NEXT;
END;
$$;

-- Update assign_email_and_invite function with proper search_path
CREATE OR REPLACE FUNCTION public.assign_email_and_invite(
  p_individual_id uuid,
  p_real_email text,
  p_invitee_name text DEFAULT NULL
)
RETURNS TABLE(success boolean, magic_link_token text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _current_user uuid := auth.uid();
  _magic_token text;
  _real_email text := lower(trim(p_real_email));
BEGIN
  IF _current_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate email format
  IF _real_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;

  -- Check if current user is admin for this individual
  IF NOT EXISTS (
    SELECT 1 FROM public.supporters 
    WHERE individual_id = p_individual_id 
    AND supporter_id = _current_user 
    AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Must be admin for this individual';
  END IF;

  -- Generate magic link token
  _magic_token := substring(replace((gen_random_uuid()::text || gen_random_uuid()::text), '-', '') from 1 for 32);

  -- Update auth.users email
  UPDATE auth.users 
  SET 
    email = _real_email,
    updated_at = now(),
    raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || json_build_object('magic_link_token', _magic_token, 'magic_link_expires', extract(epoch from (now() + '24 hours'::interval)))::jsonb
  WHERE id = p_individual_id;

  -- Update profile
  UPDATE public.profiles 
  SET 
    email = _real_email,
    account_status = 'pending_user_acceptance',
    authentication_status = 'magic_link_sent',
    updated_at = now()
  WHERE user_id = p_individual_id;

  -- Store invite information for email sending
  INSERT INTO public.account_claims (
    provisioner_id,
    individual_id,
    invitee_email,
    first_name,
    magic_link_token,
    magic_link_expires_at,
    status
  ) VALUES (
    _current_user,
    p_individual_id,
    _real_email,
    COALESCE(p_invitee_name, (SELECT first_name FROM public.profiles WHERE user_id = p_individual_id)),
    _magic_token,
    now() + '24 hours'::interval,
    'pending'
  ) ON CONFLICT (individual_id, provisioner_id) DO UPDATE SET
    invitee_email = EXCLUDED.invitee_email,
    magic_link_token = EXCLUDED.magic_link_token,
    magic_link_expires_at = EXCLUDED.magic_link_expires_at,
    status = 'pending',
    updated_at = now();

  success := true;
  magic_link_token := _magic_token;
  RETURN NEXT;
END;
$$;