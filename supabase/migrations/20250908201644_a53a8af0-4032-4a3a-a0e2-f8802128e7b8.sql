-- Additional hardening for supporter_invites table - complete data isolation
-- Remove any remaining broad access and ensure strict per-user isolation

-- 1. Drop any existing broad policies and recreate with strictest access
DROP POLICY IF EXISTS "Inviters can view safe invite metadata only" ON supporter_invites;

-- 2. Create ultra-restrictive per-user isolation policies
-- Users can only see their own sent invites (as inviter)
CREATE POLICY "Users can only view their own sent invites"
ON supporter_invites
FOR SELECT
TO authenticated
USING (
  inviter_id = auth.uid()
  AND inviter_id IS NOT NULL
);

-- Users can only create invites for themselves (as inviter)
CREATE POLICY "Users can only create invites as inviter"
ON supporter_invites
FOR INSERT
TO authenticated
WITH CHECK (
  inviter_id = auth.uid()
  AND inviter_id IS NOT NULL
  AND individual_id != auth.uid()  -- Cannot invite themselves
  AND expires_at > now()
);

-- Users can only update their own pending invites
CREATE POLICY "Users can only update their own pending invites"
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

-- Users can only delete their own invites
CREATE POLICY "Users can only delete their own invites"
ON supporter_invites
FOR DELETE
TO authenticated
USING (
  inviter_id = auth.uid()
  AND inviter_id IS NOT NULL
);

-- 3. Ensure no anon access whatsoever
REVOKE ALL ON supporter_invites FROM anon;
REVOKE ALL ON supporter_invites FROM public;

-- 4. Create security definer function for cross-user invite acceptance
-- This is the ONLY way to accept invites from other users
CREATE OR REPLACE FUNCTION public.accept_invite_by_token(_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _invite_record RECORD;
  _current_user_id UUID := auth.uid();
BEGIN
  -- Must be authenticated
  IF _current_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Get invite using secure token lookup
  SELECT * INTO _invite_record
  FROM public.get_invite_by_token(_token);
  
  IF _invite_record IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or expired invite');
  END IF;
  
  -- Verify current user is the individual being invited
  IF _invite_record.individual_id != _current_user_id THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized: invite not for this user');
  END IF;
  
  -- Update invite status
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

-- Grant execute permission for the secure function
GRANT EXECUTE ON FUNCTION public.accept_invite_by_token(text) TO authenticated;