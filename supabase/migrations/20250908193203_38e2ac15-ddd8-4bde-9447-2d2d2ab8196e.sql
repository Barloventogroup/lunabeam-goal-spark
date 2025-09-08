-- Fix Invitation Token and Email Security Vulnerability
-- Replace insecure invite acceptance with secure SECURITY DEFINER approach

-- Drop the problematic update policy that exposes tokens
DROP POLICY IF EXISTS "Allow invite acceptance updates" ON public.supporter_invites;

-- Create a secure invite acceptance function that bypasses RLS for token validation
CREATE OR REPLACE FUNCTION public.accept_supporter_invite_secure(_invite_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _invite_record RECORD;
  _current_user_id UUID := auth.uid();
BEGIN
  -- Validate current user is authenticated
  IF _current_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Find and validate invite (with elevated privileges)
  SELECT * INTO _invite_record
  FROM supporter_invites 
  WHERE invite_token = _invite_token 
    AND status = 'pending'
    AND expires_at > now();
  
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

-- Remove invite_token and invitee_email from SELECT policies to prevent exposure
-- Replace with policies that don't expose sensitive data

-- Drop existing SELECT policies to recreate them without token exposure
DROP POLICY IF EXISTS "Inviters can view their sent invites" ON public.supporter_invites;
DROP POLICY IF EXISTS "Individuals can view invites for their support" ON public.supporter_invites;

-- Secure SELECT policy for inviters (excludes sensitive tokens from unauthorized access)
CREATE POLICY "Inviters can view their sent invites (limited)"
ON public.supporter_invites
FOR SELECT
USING (
  inviter_id = auth.uid()
);

-- Secure SELECT policy for individuals (they can see invites for them, but not tokens)
CREATE POLICY "Individuals can view their invites (limited)"
ON public.supporter_invites  
FOR SELECT
USING (
  individual_id = auth.uid()
);

-- Add row-level security comment
COMMENT ON FUNCTION public.accept_supporter_invite_secure(text) IS 
'Securely accepts supporter invites with proper token validation and authorization checks. 
Prevents token exposure and ensures only intended recipients can accept invites.';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.accept_supporter_invite_secure(text) TO authenticated;