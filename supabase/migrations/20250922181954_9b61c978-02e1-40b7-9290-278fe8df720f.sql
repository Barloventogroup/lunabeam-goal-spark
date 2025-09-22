-- Clean up conflicting RLS policies and create working ones for supporter_invites

-- Drop all existing policies
DROP POLICY IF EXISTS "Authenticated users can create invites" ON public.supporter_invites;
DROP POLICY IF EXISTS "Inviter can create invites" ON public.supporter_invites;
DROP POLICY IF EXISTS "Inviter can view their invites" ON public.supporter_invites;
DROP POLICY IF EXISTS "Inviters can delete their own invites" ON public.supporter_invites;
DROP POLICY IF EXISTS "Inviters can update their own pending invites" ON public.supporter_invites;
DROP POLICY IF EXISTS "Users can create invites as inviter" ON public.supporter_invites;
DROP POLICY IF EXISTS "Users can delete their own invites" ON public.supporter_invites;
DROP POLICY IF EXISTS "Users can update their own pending invites" ON public.supporter_invites;
DROP POLICY IF EXISTS "Users can view only invites they sent" ON public.supporter_invites;

-- Create simple, working policies
CREATE POLICY "Allow authenticated users to insert their own invites"
ON public.supporter_invites
FOR INSERT
TO authenticated
WITH CHECK (inviter_id = auth.uid());

CREATE POLICY "Allow authenticated users to view their own invites"
ON public.supporter_invites
FOR SELECT
TO authenticated
USING (inviter_id = auth.uid());

CREATE POLICY "Allow authenticated users to update their own pending invites"
ON public.supporter_invites
FOR UPDATE
TO authenticated
USING (inviter_id = auth.uid())
WITH CHECK (inviter_id = auth.uid());

CREATE POLICY "Allow authenticated users to delete their own invites"
ON public.supporter_invites
FOR DELETE
TO authenticated
USING (inviter_id = auth.uid());