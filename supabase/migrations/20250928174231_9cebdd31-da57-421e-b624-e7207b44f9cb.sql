-- Create v2 approval RPCs that return only UUID to avoid ambiguous column names

-- Approve by email v2
CREATE OR REPLACE FUNCTION public.approve_supporter_request_by_email_v2(
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

  -- Create the real invite using secure helper (preserves original inviter)
  SELECT ci.id INTO _new_id
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

  -- Cleanup duplicates (best-effort)
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

-- Approve by request id v2
CREATE OR REPLACE FUNCTION public.approve_supporter_request_secure_v2(
  p_request_id uuid
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _current_user uuid := auth.uid();
  _request_record public.supporter_invites%ROWTYPE;
  _new_id uuid;
BEGIN
  IF _current_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get the request record
  SELECT * INTO _request_record 
  FROM public.supporter_invites 
  WHERE public.supporter_invites.id = p_request_id 
    AND public.supporter_invites.status = 'pending_admin_approval';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or not pending approval';
  END IF;

  -- Verify current user is admin for this individual
  IF NOT EXISTS (
    SELECT 1 FROM public.supporters s
    WHERE s.individual_id = _request_record.individual_id 
      AND s.supporter_id = _current_user 
      AND s.is_admin = true
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Must be admin for this individual';
  END IF;

  -- Create the real invite using secure helper (preserves original inviter)
  SELECT ci.id INTO _new_id
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

  -- Cleanup the original request and potential duplicates (best-effort)
  BEGIN
    DELETE FROM public.supporter_invites si
    WHERE si.individual_id = _request_record.individual_id
      AND (si.id = p_request_id OR lower(trim(si.invitee_email)) = lower(trim(_request_record.invitee_email)))
      AND si.status = 'pending_admin_approval';
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Skipping cleanup: %', SQLERRM;
  END;

  RETURN _new_id;
END;
$$;

-- Permissions: allow authenticated users to execute (logic inside enforces admin)
GRANT EXECUTE ON FUNCTION public.approve_supporter_request_by_email_v2(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_supporter_request_secure_v2(uuid) TO authenticated;