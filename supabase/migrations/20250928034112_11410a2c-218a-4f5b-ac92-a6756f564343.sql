-- Add secure functions for approving and denying supporter requests

-- Function to approve a supporter request (handles the entire flow securely)
CREATE OR REPLACE FUNCTION public.approve_supporter_request_secure(p_request_id uuid)
RETURNS TABLE(id uuid, individual_id uuid, inviter_id uuid, invitee_email text, invitee_name text, role user_role, permission_level permission_level, specific_goals uuid[], invite_token text, message text, expires_at timestamp with time zone, created_at timestamp with time zone, status invite_status)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _current_user uuid := auth.uid();
  _request_record supporter_invites%ROWTYPE;
  _token text;
  _new_id uuid;
BEGIN
  IF _current_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get the request record
  SELECT * INTO _request_record 
  FROM public.supporter_invites 
  WHERE id = p_request_id AND status = 'pending_admin_approval';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or not pending approval';
  END IF;

  -- Verify current user is admin for this individual
  IF NOT EXISTS (
    SELECT 1 FROM public.supporters 
    WHERE individual_id = _request_record.individual_id 
      AND supporter_id = _current_user 
      AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Must be admin for this individual';
  END IF;

  -- Generate new invite token
  _token := substring(replace((gen_random_uuid()::text || gen_random_uuid()::text), '-', '') from 1 for 24);

  -- Insert new pending invite (preserving original inviter_id)
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
    message,
    expires_at,
    status
  ) VALUES (
    gen_random_uuid(),
    _request_record.individual_id,
    _request_record.inviter_id,  -- Preserve original inviter
    _request_record.invitee_email,
    _request_record.invitee_name,
    _request_record.role,
    _request_record.permission_level,
    _request_record.specific_goals,
    _token,
    _request_record.message,
    now() + '7 days'::interval,
    'pending'
  ) RETURNING supporter_invites.id INTO _new_id;

  -- Delete the original request (bypasses RLS since we're SECURITY DEFINER)
  DELETE FROM public.supporter_invites WHERE id = p_request_id;

  -- Return the new invite record
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
$function$;

-- Function to deny a supporter request
CREATE OR REPLACE FUNCTION public.deny_supporter_request_secure(p_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _current_user uuid := auth.uid();
  _request_record supporter_invites%ROWTYPE;
BEGIN
  IF _current_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get the request record
  SELECT * INTO _request_record 
  FROM public.supporter_invites 
  WHERE id = p_request_id AND status = 'pending_admin_approval';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or not pending approval';
  END IF;

  -- Verify current user is admin for this individual
  IF NOT EXISTS (
    SELECT 1 FROM public.supporters 
    WHERE individual_id = _request_record.individual_id 
      AND supporter_id = _current_user 
      AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Must be admin for this individual';
  END IF;

  -- Update status to declined (bypasses RLS since we're SECURITY DEFINER)
  UPDATE public.supporter_invites 
  SET status = 'declined', updated_at = now()
  WHERE id = p_request_id;
END;
$function$;