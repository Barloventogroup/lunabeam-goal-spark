-- Create secure function to insert supporter_invites bypassing RLS safely
CREATE OR REPLACE FUNCTION public.create_supporter_invite_secure(
  p_individual_id uuid,
  p_invitee_email text,
  p_invitee_name text DEFAULT NULL,
  p_role public.user_role,
  p_permission_level public.permission_level,
  p_specific_goals uuid[] DEFAULT ARRAY[]::uuid[],
  p_message text DEFAULT NULL,
  p_expires_at timestamptz DEFAULT (now() + interval '7 days')
)
RETURNS TABLE (
  id uuid,
  individual_id uuid,
  inviter_id uuid,
  invitee_email text,
  invitee_name text,
  role public.user_role,
  permission_level public.permission_level,
  specific_goals uuid[],
  invite_token text,
  message text,
  expires_at timestamptz,
  created_at timestamptz,
  status public.invite_status
) AS $$
DECLARE
  _current_user uuid := auth.uid();
  _token text;
  _new_id uuid;
BEGIN
  IF _current_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Basic validations mirroring RLS intent
  IF p_individual_id = _current_user THEN
    RAISE EXCEPTION 'Cannot invite yourself';
  END IF;
  IF p_expires_at <= now() THEN
    RAISE EXCEPTION 'expires_at must be in the future';
  END IF;

  -- Generate URL-safe token
  _token := substring(replace((gen_random_uuid()::text || gen_random_uuid()::text), '-', '') from 1 for 24);

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
    p_individual_id,
    _current_user,
    trim(p_invitee_email),
    nullif(trim(p_invitee_name), ''),
    p_role,
    p_permission_level,
    COALESCE(p_specific_goals, ARRAY[]::uuid[]),
    _token,
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
    si.message,
    si.expires_at,
    si.created_at,
    si.status
  FROM public.supporter_invites si
  WHERE si.id = _new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;