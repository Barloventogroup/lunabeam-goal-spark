-- Create a secure function to provision an individual profile on-behalf of the current admin/supporter
-- This avoids RLS recursion and allows inserting a profile with a new user_id
CREATE OR REPLACE FUNCTION public.provision_individual(
  p_first_name text,
  p_strengths text[] DEFAULT ARRAY[]::text[],
  p_interests text[] DEFAULT ARRAY[]::text[],
  p_comm_pref text DEFAULT 'text'
)
RETURNS TABLE(individual_id uuid, claim_token text, claim_passcode text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current_user uuid := auth.uid();
  _new_individual_id uuid := gen_random_uuid();
  _claim_token text := encode(gen_random_bytes(12), 'hex');
  _claim_passcode text := upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 6));
BEGIN
  IF _current_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Create the individual's profile marked as created by this supporter/admin
  INSERT INTO public.profiles (
    user_id,
    first_name,
    strengths,
    interests,
    challenges,
    comm_pref,
    onboarding_complete,
    created_by_supporter,
    account_status
  ) VALUES (
    _new_individual_id,
    COALESCE(NULLIF(TRIM(p_first_name), ''), 'Individual'),
    COALESCE(p_strengths, ARRAY[]::text[]),
    COALESCE(p_interests, ARRAY[]::text[]),
    ARRAY[]::text[],
    COALESCE(NULLIF(TRIM(p_comm_pref), ''), 'text'),
    false,
    _current_user,
    'pending_user_consent'
  );

  -- Create supporter relationship (admin/provisioner)
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
    'collaborator',
    true,
    true
  );

  -- Create account claim so the individual can claim later
  INSERT INTO public.account_claims (
    provisioner_id,
    individual_id,
    claim_token,
    claim_passcode
  ) VALUES (
    _current_user,
    _new_individual_id,
    _claim_token,
    _claim_passcode
  );

  individual_id := _new_individual_id;
  claim_token := _claim_token;
  claim_passcode := _claim_passcode;
  RETURN NEXT;
END;
$$;