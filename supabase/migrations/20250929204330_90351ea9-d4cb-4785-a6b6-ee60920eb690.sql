-- Add supporter_setup_token to approve_supporter_request_by_email_v3
CREATE OR REPLACE FUNCTION public.approve_supporter_request_by_email_v3(
  p_individual_id uuid,
  p_invitee_email text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _current_user uuid := auth.uid();
  _request_record public.supporter_invites%ROWTYPE;
  _new_id uuid;
  _token text;
  _supporter_token text;
BEGIN
  IF _current_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verify admin for this individual
  IF NOT EXISTS (
    SELECT 1 FROM public.supporters s
    WHERE s.individual_id = p_individual_id
      AND s.supporter_id = _current_user
      AND s.is_admin = true
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Must be admin for this individual';
  END IF;

  -- Find latest pending request by email
  SELECT * INTO _request_record
  FROM public.supporter_invites si
  WHERE si.individual_id = p_individual_id
    AND lower(trim(si.invitee_email)) = lower(trim(p_invitee_email))
    AND si.status = 'pending_admin_approval'
  ORDER BY si.created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or not pending approval';
  END IF;

  -- Create new invite (pending) with both tokens
  _token := substring(replace((gen_random_uuid()::text || gen_random_uuid()::text), '-', '') from 1 for 24);
  _supporter_token := substring(replace((gen_random_uuid()::text || gen_random_uuid()::text), '-', '') from 1 for 32);

  INSERT INTO public.supporter_invites (
    id,
    individual_id,
    inviter_id,
    invitee_email,
    invitee_name,
    role,
    permission_level,
    specific_goals,
    invite_token,
    supporter_setup_token,
    message,
    expires_at,
    status,
    requires_approval,
    requested_by
  ) VALUES (
    gen_random_uuid(),
    _request_record.individual_id,
    _request_record.inviter_id,
    trim(_request_record.invitee_email),
    _request_record.invitee_name,
    _request_record.role,
    _request_record.permission_level,
    COALESCE(_request_record.specific_goals, ARRAY[]::uuid[]),
    _token,
    _supporter_token,
    _request_record.message,
    now() + '7 days'::interval,
    'pending',
    false,
    NULL
  )
  RETURNING supporter_invites.id INTO _new_id;

  -- Clean up the original request(s)
  BEGIN
    DELETE FROM public.supporter_invites si
    WHERE si.individual_id = p_individual_id
      AND lower(trim(si.invitee_email)) = lower(trim(p_invitee_email))
      AND si.status = 'pending_admin_approval';
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Skipping duplicate cleanup: %', SQLERRM;
  END;

  RETURN _new_id;
END;
$$;

-- Create public RPC to get supporter invite without authentication (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_supporter_invite_public(p_token text)
RETURNS TABLE(
  id uuid,
  individual_id uuid,
  invitee_email text,
  invitee_name text,
  role user_role,
  permission_level permission_level,
  message text,
  supporter_setup_token text,
  individual_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    si.id,
    si.individual_id,
    si.invitee_email,
    si.invitee_name,
    si.role,
    si.permission_level,
    si.message,
    si.supporter_setup_token,
    p.first_name as individual_name
  FROM public.supporter_invites si
  LEFT JOIN public.profiles p ON p.user_id = si.individual_id
  WHERE (si.supporter_setup_token = p_token OR si.invite_token = p_token)
    AND si.status = 'pending'
    AND si.expires_at > now()
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_supporter_invite_public(text) TO anon, authenticated;