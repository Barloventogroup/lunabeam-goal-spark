-- Fix invite acceptance to assign supporter_id = current user and remove wrong individual check
-- Also allow fetching invite details by token without requiring individual match

-- 1) Update accept_invite_by_token
CREATE OR REPLACE FUNCTION public.accept_invite_by_token(_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _invite_record RECORD;
  _current_user_id UUID := auth.uid();
BEGIN
  -- Must be authenticated
  IF _current_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Get invite using secure token lookup (validates pending + not expired)
  SELECT * INTO _invite_record
  FROM public.get_invite_by_token(_token);
  
  IF _invite_record IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or expired invite');
  END IF;
  
  -- Mark invite accepted
  UPDATE supporter_invites 
  SET status = 'accepted'
  WHERE id = _invite_record.id;
  
  -- Create supporter relationship linking CURRENT USER as supporter of the invite's individual
  BEGIN
    INSERT INTO supporters (
      individual_id,
      supporter_id, 
      role,
      permission_level,
      specific_goals
    ) VALUES (
      _invite_record.individual_id,
      _current_user_id,
      _invite_record.role,
      _invite_record.permission_level,
      COALESCE(_invite_record.specific_goals, '{}')
    );
  EXCEPTION WHEN unique_violation THEN
    -- If relationship already exists, update role/permissions
    UPDATE supporters SET 
      role = _invite_record.role,
      permission_level = _invite_record.permission_level,
      specific_goals = COALESCE(_invite_record.specific_goals, '{}')
    WHERE individual_id = _invite_record.individual_id
      AND supporter_id = _current_user_id;
  END;
  
  RETURN json_build_object('success', true, 'message', 'Invite accepted successfully');
END;
$$;

-- 2) Update accept_supporter_invite_secure (same logic, kept for backward compatibility)
CREATE OR REPLACE FUNCTION public.accept_supporter_invite_secure(_invite_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _invite_record RECORD;
  _current_user_id UUID := auth.uid();
BEGIN
  IF _current_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT * INTO _invite_record
  FROM public.get_invite_by_token(_invite_token);
  
  IF _invite_record IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or expired invite');
  END IF;
  
  UPDATE supporter_invites 
  SET status = 'accepted'
  WHERE id = _invite_record.id;
  
  BEGIN
    INSERT INTO supporters (
      individual_id,
      supporter_id, 
      role,
      permission_level,
      specific_goals
    ) VALUES (
      _invite_record.individual_id,
      _current_user_id,
      _invite_record.role,
      _invite_record.permission_level,
      COALESCE(_invite_record.specific_goals, '{}')
    );
  EXCEPTION WHEN unique_violation THEN
    UPDATE supporters SET 
      role = _invite_record.role,
      permission_level = _invite_record.permission_level,
      specific_goals = COALESCE(_invite_record.specific_goals, '{}')
    WHERE individual_id = _invite_record.individual_id
      AND supporter_id = _current_user_id;
  END;
  
  RETURN json_build_object('success', true, 'message', 'Invite accepted successfully');
END;
$$;

-- 3) Loosen get_my_invite_by_token to fetch by token (still pending + not expired)
CREATE OR REPLACE FUNCTION public.get_my_invite_by_token(_token text)
RETURNS TABLE(
  id uuid,
  role user_role,
  permission_level permission_level,
  invitee_name text,
  message text,
  status invite_status,
  expires_at timestamptz,
  inviter_name text,
  masked_email text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    i.id,
    i.role,
    i.permission_level,
    i.invitee_name,
    i.message,
    i.status,
    i.expires_at,
    COALESCE(p.first_name, 'Someone') as inviter_name,
    CASE 
      WHEN LENGTH(i.invitee_email) > 0 THEN 
        SUBSTRING(i.invitee_email, 1, 1) || '***@' || SPLIT_PART(i.invitee_email, '@', 2)
      ELSE NULL
    END as masked_email
  FROM public.supporter_invites i
  LEFT JOIN public.profiles p ON p.user_id = i.inviter_id
  WHERE i.invite_token = _token 
    AND i.status = 'pending'
    AND i.expires_at > now();
$$;