-- Fix security issue: Restrict circle_invites access to only the inviter
-- This prevents circle owners from seeing contact information of invitees they didn't invite

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Users can view invites they sent or received" ON circle_invites;

-- Create a more restrictive policy that only allows inviters to see their own invitations
CREATE POLICY "Users can only view invites they sent" 
ON circle_invites 
FOR SELECT 
USING (inviter_id = auth.uid());

-- Update the existing INSERT policy to be more explicit
DROP POLICY IF EXISTS "Circle owners can create invites" ON circle_invites;

CREATE POLICY "Circle owners can create invites for their circles" 
ON circle_invites 
FOR INSERT 
WITH CHECK (
  circle_id IN (
    SELECT family_circles.id 
    FROM family_circles 
    WHERE family_circles.owner_id = auth.uid()
  ) 
  AND inviter_id = auth.uid()
);

-- Update the existing UPDATE policy to be more explicit
DROP POLICY IF EXISTS "Circle owners can update invites" ON circle_invites;

CREATE POLICY "Users can update their own invites" 
ON circle_invites 
FOR UPDATE 
USING (inviter_id = auth.uid());

-- Add a policy for circle owners to update invites in their circles (for status changes, etc.)
CREATE POLICY "Circle owners can update invites in their circles" 
ON circle_invites 
FOR UPDATE 
USING (
  circle_id IN (
    SELECT family_circles.id 
    FROM family_circles 
    WHERE family_circles.owner_id = auth.uid()
  )
);