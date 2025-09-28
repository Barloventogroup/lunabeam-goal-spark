-- Update approval function to create supporter record immediately
CREATE OR REPLACE FUNCTION public.approve_supporter_request_by_email_v3(p_individual_id uuid, p_invitee_email text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  _current_user uuid := auth.uid();
  _request_record public.supporter_invites%ROWTYPE;
  _new_invite_id uuid;
  _supporter_record_id uuid;
  _invitee_user_id uuid;
BEGIN
  IF _current_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Find the latest pending admin approval request by email
  SELECT * INTO _request_record
  FROM public.supporter_invites 
  WHERE public.supporter_invites.individual_id = p_individual_id 
    AND lower(trim(public.supporter_invites.invitee_email)) = lower(trim(p_invitee_email))
    AND public.supporter_invites.status = 'pending_admin_approval'
  ORDER BY public.supporter_invites.created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or not pending approval';
  END IF;

  -- Verify current user is admin for this individual
  IF NOT EXISTS (
    SELECT 1 FROM public.supporters s
    WHERE s.individual_id = p_individual_id 
      AND s.supporter_id = _current_user 
      AND s.is_admin = true
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Must be admin for this individual';
  END IF;

  -- Check if user with this email already exists
  SELECT id INTO _invitee_user_id 
  FROM auth.users 
  WHERE lower(trim(email)) = lower(trim(p_invitee_email));

  -- Create supporter record immediately (even if user doesn't exist yet)
  INSERT INTO public.supporters (
    individual_id,
    supporter_id,
    role,
    permission_level,
    specific_goals,
    is_admin,
    is_provisioner,
    invited_by
  ) VALUES (
    _request_record.individual_id,
    COALESCE(_invitee_user_id, gen_random_uuid()), -- Generate temporary ID if user doesn't exist
    _request_record.role,
    _request_record.permission_level,
    _request_record.specific_goals,
    false,
    false,
    _request_record.inviter_id
  ) RETURNING id INTO _supporter_record_id;

  -- Create profile if user doesn't exist yet (for supporter setup)
  IF _invitee_user_id IS NULL THEN
    INSERT INTO public.profiles (
      user_id,
      email,
      first_name,
      user_type,
      account_status,
      authentication_status,
      onboarding_complete
    ) VALUES (
      (SELECT supporter_id FROM public.supporters WHERE id = _supporter_record_id),
      lower(trim(p_invitee_email)),
      COALESCE(_request_record.invitee_name, 'User'),
      'supporter',
      'pending_setup',
      'pending',
      true -- Supporters skip onboarding
    );
  ELSE
    -- Update existing profile to supporter type
    UPDATE public.profiles 
    SET user_type = 'supporter',
        account_status = 'pending_setup',
        authentication_status = 'pending',
        onboarding_complete = true
    WHERE user_id = _invitee_user_id;
  END IF;

  -- Create the real invite using secure helper (preserves original inviter)
  SELECT ci.id INTO _new_invite_id
  FROM public.create_supporter_invite_secure(
    _request_record.individual_id,
    _request_record.invitee_email,
    _request_record.invitee_name,
    _request_record.role,
    _request_record.permission_level,
    _request_record.specific_goals,
    _request_record.message,
    now() + '7 days'::interval,
    _request_record.inviter_id
  ) AS ci;

  -- Add supporter_setup_token to the new invite
  UPDATE public.supporter_invites 
  SET supporter_setup_token = substring(replace((gen_random_uuid()::text || gen_random_uuid()::text), '-', '') from 1 for 32)
  WHERE id = _new_invite_id;

  -- Cleanup duplicates (best-effort)
  BEGIN
    DELETE FROM public.supporter_invites si
    WHERE si.individual_id = p_individual_id
      AND lower(trim(si.invitee_email)) = lower(trim(p_invitee_email))
      AND si.status = 'pending_admin_approval';
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Skipping duplicate cleanup: %', SQLERRM;
  END;

  RETURN _new_invite_id;
END;
$function$;

-- Add supporter_setup_token column to supporter_invites if it doesn't exist
ALTER TABLE public.supporter_invites 
ADD COLUMN IF NOT EXISTS supporter_setup_token text;