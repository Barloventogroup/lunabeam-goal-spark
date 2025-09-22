-- Improve invite acceptance with explicit status checks and better errors

-- Update accept_invite_by_token
CREATE OR REPLACE FUNCTION public.accept_invite_by_token(_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  r supporter_invites%ROWTYPE;
  _current_user_id uuid := auth.uid();
BEGIN
  IF _current_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT * INTO r FROM public.supporter_invites WHERE invite_token = _token;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid invite link');
  END IF;

  IF r.expires_at <= now() THEN
    RETURN json_build_object('success', false, 'error', 'Invite expired');
  END IF;

  IF r.status = 'accepted' THEN
    RETURN json_build_object('success', false, 'error', 'Invite already accepted');
  ELSIF r.status = 'declined' THEN
    RETURN json_build_object('success', false, 'error', 'Invite declined');
  END IF;

  -- Accept the invite
  UPDATE supporter_invites SET status = 'accepted' WHERE id = r.id;

  -- Link current user as supporter
  BEGIN
    INSERT INTO supporters (
      individual_id,
      supporter_id,
      role,
      permission_level,
      specific_goals,
      invited_by
    ) VALUES (
      r.individual_id,
      _current_user_id,
      r.role,
      r.permission_level,
      COALESCE(r.specific_goals, '{}'),
      r.inviter_id
    );
  EXCEPTION WHEN unique_violation THEN
    UPDATE supporters SET 
      role = r.role,
      permission_level = r.permission_level,
      specific_goals = COALESCE(r.specific_goals, '{}')
    WHERE individual_id = r.individual_id
      AND supporter_id = _current_user_id;
  END;

  RETURN json_build_object('success', true, 'message', 'Invite accepted successfully');
END;
$$;

-- Update accept_supporter_invite_secure similarly
CREATE OR REPLACE FUNCTION public.accept_supporter_invite_secure(_invite_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  r supporter_invites%ROWTYPE;
  _current_user_id uuid := auth.uid();
BEGIN
  IF _current_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT * INTO r FROM public.supporter_invites WHERE invite_token = _invite_token;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid invite link');
  END IF;

  IF r.expires_at <= now() THEN
    RETURN json_build_object('success', false, 'error', 'Invite expired');
  END IF;

  IF r.status = 'accepted' THEN
    RETURN json_build_object('success', false, 'error', 'Invite already accepted');
  ELSIF r.status = 'declined' THEN
    RETURN json_build_object('success', false, 'error', 'Invite declined');
  END IF;

  UPDATE supporter_invites SET status = 'accepted' WHERE id = r.id;

  BEGIN
    INSERT INTO supporters (
      individual_id,
      supporter_id,
      role,
      permission_level,
      specific_goals,
      invited_by
    ) VALUES (
      r.individual_id,
      _current_user_id,
      r.role,
      r.permission_level,
      COALESCE(r.specific_goals, '{}'),
      r.inviter_id
    );
  EXCEPTION WHEN unique_violation THEN
    UPDATE supporters SET 
      role = r.role,
      permission_level = r.permission_level,
      specific_goals = COALESCE(r.specific_goals, '{}')
    WHERE individual_id = r.individual_id
      AND supporter_id = _current_user_id;
  END;

  RETURN json_build_object('success', true, 'message', 'Invite accepted successfully');
END;
$$;