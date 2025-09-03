-- Fix security issue: Restrict circle_invites access to only the inviter
-- Clean slate approach - drop all existing policies and recreate them properly

-- Drop all existing policies for circle_invites
DROP POLICY IF EXISTS "Users can view invites they sent or received" ON circle_invites;
DROP POLICY IF EXISTS "Users can only view invites they sent" ON circle_invites;
DROP POLICY IF EXISTS "Circle owners can create invites" ON circle_invites;
DROP POLICY IF EXISTS "Circle owners can create invites for their circles" ON circle_invites;
DROP POLICY IF EXISTS "Circle owners can update invites" ON circle_invites;
DROP POLICY IF EXISTS "Users can update their own invites" ON circle_invites;
DROP POLICY IF EXISTS "Circle owners can update invites in their circles" ON circle_invites;

-- Create secure policies that restrict contact information access

-- Only allow inviters to see their own invitations (with all sensitive data)
CREATE POLICY "Inviters can view their own invites" 
ON circle_invites 
FOR SELECT 
USING (inviter_id = auth.uid());

-- Circle owners can create invites for their circles
CREATE POLICY "Circle owners can create invites" 
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

-- Users can update their own invites
CREATE POLICY "Inviters can update their own invites" 
ON circle_invites 
FOR UPDATE 
USING (inviter_id = auth.uid());

-- Circle owners can update invite status in their circles (but can't see sensitive contact info due to SELECT restriction)
CREATE POLICY "Circle owners can update invite status" 
ON circle_invites 
FOR UPDATE 
USING (
  circle_id IN (
    SELECT family_circles.id 
    FROM family_circles 
    WHERE family_circles.owner_id = auth.uid()
  )
);