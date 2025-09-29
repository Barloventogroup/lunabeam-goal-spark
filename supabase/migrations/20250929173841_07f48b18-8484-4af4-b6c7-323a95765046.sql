-- Drop and recreate create_supporter_invite_secure to add supporter_setup_token to return type
DROP FUNCTION IF EXISTS public.create_supporter_invite_secure(uuid, text, text, user_role, permission_level, uuid[], text, timestamp with time zone, uuid);

CREATE FUNCTION public.create_supporter_invite_secure(
  p_individual_id uuid, 
  p_invitee_email text, 
  p_invitee_name text DEFAULT NULL::text, 
  p_role user_role DEFAULT 'supporter'::user_role, 
  p_permission_level permission_level DEFAULT 'viewer'::permission_level, 
  p_specific_goals uuid[] DEFAULT ARRAY[]::uuid[], 
  p_message text DEFAULT NULL::text, 
  p_expires_at timestamp with time zone DEFAULT (now() + '7 days'::interval), 
  p_inviter_id uuid DEFAULT NULL::uuid
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
  supporter_setup_token text,
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
  _actual_inviter_id uuid;
  _token text;
  _supporter_token text;
  _new_id uuid;
  _inviter_email text;
BEGIN
  IF _current_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Use provided inviter_id if given, otherwise use current user
  _actual_inviter_id := COALESCE(p_inviter_id, _current_user);

  -- Get inviter's email for self-invite check
  SELECT email INTO _inviter_email 
  FROM auth.users 
  WHERE id = _actual_inviter_id;

  -- Prevent user from inviting their own email address
  IF _inviter_email IS NOT NULL AND 
     lower(trim(p_invitee_email)) = lower(trim(_inviter_email)) THEN
    RAISE EXCEPTION 'Cannot invite yourself';
  END IF;

  -- Basic validations
  IF p_expires_at <= now() THEN
    RAISE EXCEPTION 'expires_at must be in the future';
  END IF;

  -- Generate URL-safe token for general invite
  _token := substring(replace((gen_random_uuid()::text || gen_random_uuid()::text), '-', '') from 1 for 24);
  
  -- Generate separate URL-safe token for supporter setup
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
    status
  ) VALUES (
    gen_random_uuid(),
    p_individual_id,
    _actual_inviter_id,
    trim(p_invitee_email),
    nullif(trim(p_invitee_name), ''),
    p_role,
    p_permission_level,
    COALESCE(p_specific_goals, ARRAY[]::uuid[]),
    _token,
    _supporter_token,
    nullif(p_message, ''),
    p_expires_at,
    'pending'
  ) RETURNING supporter_invites.id INTO _new_id;

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
    si.supporter_setup_token,
    si.message,
    si.expires_at,
    si.created_at,
    si.status
  FROM public.supporter_invites si
  WHERE si.id = _new_id;
END;
$function$;