-- Create SECURITY DEFINER function to get pending requests for an individual
CREATE OR REPLACE FUNCTION public.get_pending_requests_for_individual(p_individual_id uuid)
RETURNS TABLE(
  id uuid,
  individual_id uuid,
  inviter_id uuid,
  invitee_email text,
  invitee_name text,
  role user_role,
  permission_level permission_level,
  specific_goals uuid[],
  message text,
  expires_at timestamptz,
  created_at timestamptz,
  status invite_status
) AS $$
DECLARE
  _current_user uuid := auth.uid();
BEGIN
  IF _current_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verify the caller is either the individual or an admin supporter
  IF _current_user != p_individual_id AND NOT EXISTS (
    SELECT 1 FROM public.supporters s
    WHERE s.individual_id = p_individual_id 
      AND s.supporter_id = _current_user 
      AND s.is_admin = true
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Must be the individual or an admin supporter';
  END IF;

  -- Return pending admin approval requests for this individual
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
    si.message,
    si.expires_at,
    si.created_at,
    si.status
  FROM public.supporter_invites si
  WHERE si.individual_id = p_individual_id 
    AND si.status = 'pending_admin_approval'
  ORDER BY si.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_pending_requests_for_individual(uuid) TO authenticated;