-- Fix RLS policies to allow admins to view pending invites they just approved

-- Update the supporter_invites RLS policy to allow admins to view pending invites for their individuals
DROP POLICY IF EXISTS "Admins can view pending invites for their individuals" ON public.supporter_invites;

CREATE POLICY "Admins can view pending invites for their individuals" 
ON public.supporter_invites 
FOR SELECT 
USING (
  individual_id IN (
    SELECT s.individual_id
    FROM public.supporters s
    WHERE s.supporter_id = auth.uid() 
      AND s.is_admin = true
  )
);