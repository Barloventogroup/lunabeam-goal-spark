-- Create secure helper to fetch invite token and details by invite ID
CREATE OR REPLACE FUNCTION public.get_invite_token_by_id_secure(p_invite_id uuid)
RETURNS TABLE(
  invite_token text,
  invitee_email text,
  invitee_name text,
  inviter_id uuid,
  individual_id uuid,
  message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _current_user uuid := auth.uid();
  _invite_record record;
BEGIN
  IF _current_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get the invite record
  SELECT 
    si.invite_token,
    si.invitee_email,
    si.invitee_name,
    si.inviter_id,
    si.individual_id,
    si.message
  INTO _invite_record
  FROM public.supporter_invites si
  WHERE si.id = p_invite_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invite not found';
  END IF;

  -- Verify current user is admin for this individual
  IF NOT EXISTS (
    SELECT 1 FROM public.supporters s
    WHERE s.individual_id = _invite_record.individual_id 
      AND s.supporter_id = _current_user 
      AND s.is_admin = true
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Must be admin for this individual';
  END IF;

  -- Return the invite details
  RETURN QUERY
  SELECT 
    _invite_record.invite_token,
    _invite_record.invitee_email,
    _invite_record.invitee_name,
    _invite_record.inviter_id,
    _invite_record.individual_id,
    _invite_record.message;
END;
$function$;