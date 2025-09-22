-- 1) Add a safe place to store the provisional name without requiring an auth user
ALTER TABLE public.account_claims
ADD COLUMN IF NOT EXISTS first_name text;

-- 2) Update provision_individual to avoid inserting into profiles (FK issue) and only create an account claim
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
  _claim_token text;
  _claim_passcode text := upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 6));
BEGIN
  IF _current_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Generate a URL-safe claim token
  _claim_token := substring(replace((gen_random_uuid()::text || gen_random_uuid()::text), '-', '') from 1 for 24);

  -- Store minimal info for display without touching profiles (which has FK to auth.users)
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

-- 3) Ensure the list of provisioned individuals can surface names even without profiles
CREATE OR REPLACE FUNCTION public.get_my_provisioned_individuals()
RETURNS TABLE(user_id uuid, first_name text, status invite_status)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ac.individual_id as user_id,
    COALESCE(p.first_name, ac.first_name, 'Unknown Individual') as first_name,
    ac.status
  FROM public.account_claims ac
  LEFT JOIN public.profiles p ON p.user_id = ac.individual_id
  WHERE ac.provisioner_id = auth.uid();
$$;