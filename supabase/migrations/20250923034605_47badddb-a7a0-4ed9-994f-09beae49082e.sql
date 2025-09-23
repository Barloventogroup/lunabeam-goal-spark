-- Fix provision_individual_with_email to avoid foreign key constraint violation
-- The issue is we're creating a profile without a corresponding auth.users record

DROP FUNCTION IF EXISTS public.provision_individual_with_email(text, text, text[], text[], text);

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
AS $$
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

  -- DON'T create profile record yet - wait until user actually signs up
  -- This avoids the foreign key constraint violation

  -- Store the claim information with the invitation details
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

  -- Store the provisioning details in a separate table for later use
  INSERT INTO public.provisional_profiles (
    user_id,
    first_name,
    email,
    strengths,
    interests,
    comm_pref,
    created_by_supporter
  ) VALUES (
    _new_individual_id,
    COALESCE(NULLIF(TRIM(p_first_name), ''), 'Individual'),
    _user_email,
    p_strengths,
    p_interests,
    p_comm_pref,
    _current_user
  ) ON CONFLICT (user_id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    email = EXCLUDED.email,
    strengths = EXCLUDED.strengths,
    interests = EXCLUDED.interests,
    comm_pref = EXCLUDED.comm_pref,
    updated_at = now();

  individual_id := _new_individual_id;
  claim_token := _claim_token;
  magic_link_token := _magic_token;
  RETURN NEXT;
END;
$$;

-- Create a table to store provisional profile data until the user signs up
CREATE TABLE IF NOT EXISTS public.provisional_profiles (
  user_id uuid PRIMARY KEY,
  first_name text NOT NULL,
  email text NOT NULL,
  strengths text[] DEFAULT '{}',
  interests text[] DEFAULT '{}',
  comm_pref text DEFAULT 'text',
  created_by_supporter uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on provisional_profiles
ALTER TABLE public.provisional_profiles ENABLE ROW LEVEL SECURITY;

-- Allow supporters to view and manage their provisional profiles
CREATE POLICY "Supporters can manage their provisional profiles"
ON public.provisional_profiles
FOR ALL
USING (created_by_supporter = auth.uid());

-- Update the handle_new_user function to check for provisional profile data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _first_name text;
  _provisional_data record;
BEGIN
  -- Check if there's provisional profile data for this user
  SELECT * INTO _provisional_data
  FROM public.provisional_profiles
  WHERE user_id = NEW.id;

  IF _provisional_data IS NOT NULL THEN
    -- User was provisioned with invitation data
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
      NEW.id,
      _provisional_data.first_name,
      _provisional_data.email,
      _provisional_data.strengths,
      _provisional_data.interests,
      _provisional_data.comm_pref,
      false,
      'pending_user_consent',
      'pending',
      false,
      _provisional_data.created_by_supporter
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
      NEW.id,
      _provisional_data.created_by_supporter,
      'supporter',
      'admin',
      true,
      true
    ) ON CONFLICT (individual_id, supporter_id) DO NOTHING;

    -- Clean up provisional data
    DELETE FROM public.provisional_profiles WHERE user_id = NEW.id;
  ELSE
    -- Regular user signup
    _first_name := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data ->> 'first_name'), ''), 'User');

    INSERT INTO public.profiles (user_id, first_name, onboarding_complete, comm_pref)
    VALUES (NEW.id, _first_name, false, 'text');
  END IF;

  RETURN NEW;
END;
$$;