-- Update account_claims table for email-based claiming
ALTER TABLE public.account_claims 
DROP COLUMN IF EXISTS claim_passcode,
ADD COLUMN IF NOT EXISTS invitee_email text,
ADD COLUMN IF NOT EXISTS magic_link_token text,
ADD COLUMN IF NOT EXISTS magic_link_expires_at timestamp with time zone DEFAULT (now() + '24 hours'::interval);

-- Update the claim function to work with email-based flow
CREATE OR REPLACE FUNCTION public.provision_individual_with_email(
  p_first_name text, 
  p_invitee_email text,
  p_strengths text[] DEFAULT ARRAY[]::text[], 
  p_interests text[] DEFAULT ARRAY[]::text[], 
  p_comm_pref text DEFAULT 'text'::text
)
RETURNS TABLE(individual_id uuid, claim_token text, magic_link_token text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _current_user uuid := auth.uid();
  _new_individual_id uuid := gen_random_uuid();
  _claim_token text;
  _magic_token text;
  _user_email text := lower(trim(p_invitee_email));
BEGIN
  IF _current_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate email format
  IF _user_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;

  -- Generate URL-safe tokens
  _claim_token := substring(replace((gen_random_uuid()::text || gen_random_uuid()::text), '-', '') from 1 for 24);
  _magic_token := substring(replace((gen_random_uuid()::text || gen_random_uuid()::text), '-', '') from 1 for 32);

  -- Create profile for the individual (without auth.users entry yet)
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

  -- Store the claim information with email
  INSERT INTO public.account_claims (
    provisioner_id,
    individual_id,
    claim_token,
    first_name,
    invitee_email,
    magic_link_token,
    magic_link_expires_at
  ) VALUES (
    _current_user,
    _new_individual_id,
    _claim_token,
    COALESCE(NULLIF(TRIM(p_first_name), ''), 'Individual'),
    _user_email,
    _magic_token,
    now() + '24 hours'::interval
  );

  individual_id := _new_individual_id;
  claim_token := _claim_token;
  magic_link_token := _magic_token;
  RETURN NEXT;
END;
$function$;