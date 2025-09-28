-- Add secure functions for approving and denying supporter requests by email
-- These functions eliminate the need for client-side SELECT operations on supporter_invites

-- Function to approve a supporter request by individual_id and email
CREATE OR REPLACE FUNCTION public.approve_supporter_request_by_email(p_individual_id uuid, p_invitee_email text)
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

  -- Get the request record by individual_id and email
  SELECT * INTO _request_record 
  FROM public.supporter_invites 
  WHERE individual_id = p_individual_id 
    AND lower(trim(invitee_email)) = lower(trim(p_invitee_email))
    AND status = 'pending_admin_approval';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or not pending approval for individual % and email %', p_individual_id, p_invitee_email;
  END IF;

  -- Verify current user is admin for this individual
  IF NOT EXISTS (
    SELECT 1 FROM public.supporters 
    WHERE individual_id = p_individual_id 
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
  DELETE FROM public.supporter_invites WHERE id = _request_record.id;

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

-- Function to deny a supporter request by individual_id and email
CREATE OR REPLACE FUNCTION public.deny_supporter_request_by_email(p_individual_id uuid, p_invitee_email text)
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

  -- Get the request record by individual_id and email
  SELECT * INTO _request_record 
  FROM public.supporter_invites 
  WHERE individual_id = p_individual_id 
    AND lower(trim(invitee_email)) = lower(trim(p_invitee_email))
    AND status = 'pending_admin_approval';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or not pending approval for individual % and email %', p_individual_id, p_invitee_email;
  END IF;

  -- Verify current user is admin for this individual
  IF NOT EXISTS (
    SELECT 1 FROM public.supporters 
    WHERE individual_id = p_individual_id 
      AND supporter_id = _current_user 
      AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Must be admin for this individual';
  END IF;

  -- Update status to declined (bypasses RLS since we're SECURITY DEFINER)
  UPDATE public.supporter_invites 
  SET status = 'declined', updated_at = now()
  WHERE id = _request_record.id;
END;
$function$;