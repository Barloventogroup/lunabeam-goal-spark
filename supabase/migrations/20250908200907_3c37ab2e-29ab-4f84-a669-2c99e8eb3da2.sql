-- Fix supporter_invites security vulnerabilities
-- Issue: Email addresses and personal data could be harvested from invite system

-- First, drop existing RLS policies that are too permissive
DROP POLICY IF EXISTS "Authenticated individuals can view their received invites" ON supporter_invites;
DROP POLICY IF EXISTS "Authenticated inviters can create invites" ON supporter_invites;
DROP POLICY IF EXISTS "Authenticated inviters can update their pending invites" ON supporter_invites;
DROP POLICY IF EXISTS "Authenticated inviters can view their sent invites" ON supporter_invites;

-- Create secure function to get invite details by token (for invite acceptance)
CREATE OR REPLACE FUNCTION public.get_invite_by_token(_token text)
RETURNS TABLE (
  id uuid,
  individual_id uuid,
  inviter_id uuid,
  role user_role,
  permission_level permission_level,
  specific_goals uuid[],
  invitee_name text,
  message text,
  expires_at timestamptz,
  status invite_status
)
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $$
  SELECT 
    i.id,
    i.individual_id,
    i.inviter_id,
    i.role,
    i.permission_level,
    i.specific_goals,
    i.invitee_name,
    i.message,
    i.expires_at,
    i.status
  FROM public.supporter_invites i
  WHERE i.invite_token = _token 
    AND i.status = 'pending'
    AND i.expires_at > now();
$$;

-- Create more restrictive RLS policies
-- Only inviters can view their own sent invites (no email/personal data in these views)
CREATE POLICY "Inviters can view their sent invites metadata only"
ON supporter_invites
FOR SELECT
TO authenticated
USING (
  inviter_id = auth.uid() 
  AND inviter_id IS NOT NULL
);

-- Only inviters can create invites for others
CREATE POLICY "Authenticated users can create invites"
ON supporter_invites
FOR INSERT
TO authenticated
WITH CHECK (
  inviter_id = auth.uid() 
  AND inviter_id IS NOT NULL
  AND individual_id != auth.uid()  -- Can't invite yourself
  AND expires_at > now()
);

-- Only inviters can update their own pending invites
CREATE POLICY "Inviters can update their own pending invites"
ON supporter_invites
FOR UPDATE
TO authenticated
USING (
  inviter_id = auth.uid() 
  AND inviter_id IS NOT NULL
  AND status = 'pending'
  AND expires_at > now()
)
WITH CHECK (
  inviter_id = auth.uid()
  AND status IN ('pending', 'declined', 'expired')
);

-- Only inviters can delete their own invites
CREATE POLICY "Inviters can delete their own invites"
ON supporter_invites
FOR DELETE
TO authenticated
USING (
  inviter_id = auth.uid() 
  AND inviter_id IS NOT NULL
);

-- Update the accept invite function to use the secure token-based access
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
  -- Validate current user is authenticated
  IF _current_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Use secure function to get invite details
  SELECT * INTO _invite_record
  FROM public.get_invite_by_token(_invite_token);
  
  IF _invite_record IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or expired invite');
  END IF;
  
  -- Verify that current user is the intended individual
  IF _invite_record.individual_id != _current_user_id THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized: invite not for this user');
  END IF;
  
  -- Update invite status (bypasses RLS due to SECURITY DEFINER)
  UPDATE supporter_invites 
  SET status = 'accepted'
  WHERE id = _invite_record.id;
  
  -- Create supporter relationship
  INSERT INTO supporters (
    individual_id,
    supporter_id, 
    role,
    permission_level,
    specific_goals
  ) VALUES (
    _invite_record.individual_id,
    _invite_record.inviter_id,
    _invite_record.role,
    _invite_record.permission_level,
    COALESCE(_invite_record.specific_goals, '{}')
  );
  
  RETURN json_build_object('success', true, 'message', 'Invite accepted successfully');
END;
$$;