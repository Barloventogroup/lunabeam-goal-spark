-- Update provision_individual function to create real auth users immediately
CREATE OR REPLACE FUNCTION public.provision_individual(
  p_first_name text, 
  p_strengths text[] DEFAULT ARRAY[]::text[], 
  p_interests text[] DEFAULT ARRAY[]::text[], 
  p_comm_pref text DEFAULT 'text'::text
)
RETURNS TABLE(individual_id uuid, claim_token text, claim_passcode text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current_user uuid := auth.uid();
  _new_individual_id uuid := gen_random_uuid();
  _claim_token text;
  _claim_passcode text := upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 6));
  _user_email text;
BEGIN
  IF _current_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Generate a URL-safe claim token
  _claim_token := substring(replace((gen_random_uuid()::text || gen_random_uuid()::text), '-', '') from 1 for 24);
  
  -- Generate email for the new user
  _user_email := lower(p_first_name) || '+' || substring(_claim_token from 1 for 8) || '@temp.lunabeam.com';

  -- Insert into auth.users directly using admin privileges
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
    _user_email,
    crypt('temp_password_' || _claim_passcode, gen_salt('bf')), -- Temporary password
    now(), -- Auto-confirm email
    now(),
    now(),
    json_build_object('first_name', p_first_name)::jsonb,
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
    _user_email,
    p_strengths,
    p_interests,
    p_comm_pref,
    false,
    'pending_user_consent',
    'pending',
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

  -- Store the claim information
  INSERT INTO public.account_claims (
    provisioner_id,
    individual_id,
    claim_token,
    claim_passcode,
    first_name
  ) VALUES (
    _current_user,
    _new_individual_id,
    _claim_token,
    _claim_passcode,
    COALESCE(NULLIF(TRIM(p_first_name), ''), 'Individual')
  );

  individual_id := _new_individual_id;
  claim_token := _claim_token;
  claim_passcode := _claim_passcode;
  RETURN NEXT;
END;
$$;