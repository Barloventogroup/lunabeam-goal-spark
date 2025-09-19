-- Remove the problematic RLS policy that allows users to see raw invite data sent to them
DROP POLICY IF EXISTS "Invitees can view invitations sent to them" ON public.supporter_invites;

-- Remove duplicate policies to clean up
DROP POLICY IF EXISTS "Users can only create invites as inviter" ON public.supporter_invites;
DROP POLICY IF EXISTS "Users can only delete their own invites" ON public.supporter_invites; 
DROP POLICY IF EXISTS "Users can only update their own pending invites" ON public.supporter_invites;
DROP POLICY IF EXISTS "Users can only view their own sent invites" ON public.supporter_invites;

-- Keep only the essential policies that protect user data
-- Policy for viewing: Users can ONLY see invites they sent (not invites sent to them)
CREATE POLICY "Users can view only invites they sent" 
ON public.supporter_invites 
FOR SELECT 
USING (inviter_id = auth.uid() AND inviter_id IS NOT NULL);

-- Policy for creating: Users can create invites as inviter
CREATE POLICY "Users can create invites as inviter" 
ON public.supporter_invites 
FOR INSERT 
WITH CHECK (
  inviter_id = auth.uid() 
  AND inviter_id IS NOT NULL 
  AND individual_id <> auth.uid() 
  AND expires_at > now()
);

-- Policy for updating: Users can update their own pending invites
CREATE POLICY "Users can update their own pending invites" 
ON public.supporter_invites 
FOR UPDATE 
USING (
  inviter_id = auth.uid() 
  AND inviter_id IS NOT NULL 
  AND status = 'pending'::invite_status 
  AND expires_at > now()
) 
WITH CHECK (
  inviter_id = auth.uid() 
  AND status = ANY (ARRAY['pending'::invite_status, 'declined'::invite_status, 'expired'::invite_status])
);

-- Policy for deleting: Users can delete their own invites
CREATE POLICY "Users can delete their own invites" 
ON public.supporter_invites 
FOR DELETE 
USING (inviter_id = auth.uid() AND inviter_id IS NOT NULL);