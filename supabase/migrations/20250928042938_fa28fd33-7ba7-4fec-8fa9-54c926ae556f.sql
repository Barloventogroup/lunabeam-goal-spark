-- Fix ambiguous column references in approval/denial RPCs

-- 1) Replace approve_supporter_request_by_email with fully-qualified column references
CREATE OR REPLACE FUNCTION public.approve_supporter_request_by_email(
  p_individual_id uuid,
  p_invitee_email text
)
RETURNS TABLE(
  id uuid,
  individual_id uuid,
  inviter_id uuid,
  invitee_email text,
  invitee_name text,
  role user_role,
  permission_level permission_level,
  specific_goals uuid[],
  invite_token text,
  message text,
  expires_at timestamptz,
  created_at timestamptz,
  status invite_status
) AS $$
DECLARE
  _current_user uuid := auth.uid();
  _request_record supporter_invites%ROWTYPE;
  _new_id uuid;
BEGIN
  IF _current_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get the request record by individual_id and email (fully qualify columns)
  SELECT * INTO _request_record 
  FROM public.supporter_invites si
  WHERE si.individual_id = p_individual_id 
    AND lower(trim(si.invitee_email)) = lower(trim(p_invitee_email))
    AND si.status = 'pending_admin_approval';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or not pending approval for individual % and email %', p_individual_id, p_invitee_email;
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
  SELECT id INTO _new_id
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
  );

  -- Best-effort cleanup of original request; ignore RLS/permission errors
  BEGIN
    DELETE FROM public.supporter_invites si WHERE si.id = _request_record.id;
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Skipping deletion of original request: %', SQLERRM;
  END;

  -- Return the newly created invite
  RETURN QUERY
  SELECT 
    si.id,
    si.individual_id,
    si.inviter_id,
    si.invitee_email,
    si.invitee_name,
    si.role,
    si.permission_level,
    si.specific_goals,
    si.invite_token,
    si.message,
    si.expires_at,
    si.created_at,
    si.status
  FROM public.supporter_invites si
  WHERE si.id = _new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2) Replace deny_supporter_request_by_email with fully-qualified column references
CREATE OR REPLACE FUNCTION public.deny_supporter_request_by_email(
  p_individual_id uuid,
  p_invitee_email text
)
RETURNS void AS $$
DECLARE
  _current_user uuid := auth.uid();
  _request_record supporter_invites%ROWTYPE;
BEGIN
  IF _current_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get the request record by individual_id and email
  SELECT * INTO _request_record 
  FROM public.supporter_invites si
  WHERE si.individual_id = p_individual_id 
    AND lower(trim(si.invitee_email)) = lower(trim(p_invitee_email))
    AND si.status = 'pending_admin_approval';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or not pending approval for individual % and email %', p_individual_id, p_invitee_email;
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

  -- Update status to declined (bypasses RLS since we're SECURITY DEFINER)
  UPDATE public.supporter_invites si
  SET status = 'declined', updated_at = now()
  WHERE si.id = _request_record.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Re-grant execute permissions
GRANT EXECUTE ON FUNCTION public.approve_supporter_request_by_email(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deny_supporter_request_by_email(uuid, text) TO authenticated;