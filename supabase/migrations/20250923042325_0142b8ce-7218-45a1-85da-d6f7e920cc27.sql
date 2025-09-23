-- Add RLS policy to allow users to view other users' basic profile info for community features
CREATE POLICY "Users can view basic profile info of other users" 
ON public.profiles 
FOR SELECT 
USING (
  user_id IS NOT NULL AND 
  user_id != auth.uid() AND 
  onboarding_complete = true
);

-- Also allow users to view profiles of people they support or who support them
CREATE POLICY "Users can view profiles in their support network" 
ON public.profiles 
FOR SELECT 
USING (
  user_id IN (
    -- People I support
    SELECT individual_id FROM supporters WHERE supporter_id = auth.uid()
    UNION
    -- People who support me  
    SELECT supporter_id FROM supporters WHERE individual_id = auth.uid()
  )
);