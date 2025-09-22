-- Update invite acceptance functions to allow relinking if the same email re-signs up
-- and to return clearer messages. These functions remain SECURITY DEFINER and use RLS-safe inserts.

CREATE OR REPLACE FUNCTION public.accept_supporter_invite_secure(_invite_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  r supporter_invites%ROWTYPE;
  _current_user_id uuid := auth.uid();
  _current_email text := lower(coalesce((auth.jwt() ->> 'email'), ''));
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

  -- If already accepted, allow re-accept for the same email (covers account recreation with same email)
  IF r.status = 'accepted' THEN
    IF lower(coalesce(r.invitee_email, '')) = _current_email AND _current_email <> '' THEN
      -- Link current user as supporter (idempotent upsert)
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

      RETURN json_build_object('success', true, 'message', 'Invite relinked to your account');
    ELSE
      RETURN json_build_object('success', false, 'error', 'Invite already accepted');
    END IF;
  END IF;

  -- Accept pending invite normally
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
$function$;

-- Keep accept_invite_by_token with the same relinking behavior for compatibility
CREATE OR REPLACE FUNCTION public.accept_invite_by_token(_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  r supporter_invites%ROWTYPE;
  _current_user_id uuid := auth.uid();
  _current_email text := lower(coalesce((auth.jwt() ->> 'email'), ''));
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
    IF lower(coalesce(r.invitee_email, '')) = _current_email AND _current_email <> '' THEN
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

      RETURN json_build_object('success', true, 'message', 'Invite relinked to your account');
    ELSE
      RETURN json_build_object('success', false, 'error', 'Invite already accepted');
    END IF;
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
$function$;