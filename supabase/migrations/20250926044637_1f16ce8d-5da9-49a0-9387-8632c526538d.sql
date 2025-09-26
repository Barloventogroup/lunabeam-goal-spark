-- Add RLS policy to allow admins to view pending approval requests for their individuals
CREATE POLICY "Admins can view requests for their individuals" 
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