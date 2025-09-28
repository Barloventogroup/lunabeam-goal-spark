-- Fix ambiguous column references and update issues in supporter request functions

-- Fix deny_supporter_request_secure function 
-- Remove updated_at reference (column doesn't exist) and fully qualify all column references
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

  -- Get the request record with fully qualified column references
  SELECT * INTO _request_record 
  FROM public.supporter_invites 
  WHERE supporter_invites.id = p_request_id AND supporter_invites.status = 'pending_admin_approval';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or not pending approval';
  END IF;

  -- Verify current user is admin for this individual
  IF NOT EXISTS (
    SELECT 1 FROM public.supporters 
    WHERE supporters.individual_id = _request_record.individual_id 
      AND supporters.supporter_id = _current_user 
      AND supporters.is_admin = true
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Must be admin for this individual';
  END IF;

  -- Update status to declined (remove updated_at reference since column doesn't exist)
  UPDATE public.supporter_invites 
  SET status = 'declined'
  WHERE supporter_invites.id = p_request_id;
END;
$function$;

-- Re-apply approve_supporter_request_secure with fully qualified references
CREATE OR REPLACE FUNCTION public.approve_supporter_request_secure(p_request_id uuid)
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
  expires_at timestamp with time zone, 
  created_at timestamp with time zone, 
  status invite_status
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _current_user uuid := auth.uid();
  _request_record supporter_invites%ROWTYPE;
  _new_id uuid;
BEGIN
  IF _current_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get the request record with fully qualified references
  SELECT * INTO _request_record
  FROM public.supporter_invites 
  WHERE supporter_invites.id = p_request_id AND supporter_invites.status = 'pending_admin_approval';

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

  -- Best-effort cleanup of original request
  BEGIN
    DELETE FROM public.supporter_invites WHERE supporter_invites.id = _request_record.id;
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Skipping deletion of original request: %', SQLERRM;
  END;

  -- Return the newly created invite with fully qualified references
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