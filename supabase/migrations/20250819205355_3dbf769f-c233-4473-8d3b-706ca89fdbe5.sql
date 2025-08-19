-- Fix infinite recursion in RLS policies by removing circular dependencies

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view memberships in their circles" ON public.circle_memberships;
DROP POLICY IF EXISTS "Users can view circles they own or are members of" ON public.family_circles;

-- Recreate family_circles SELECT policy (this one is fine, it only references circle_memberships)
CREATE POLICY "Users can view circles they own or are members of" 
ON public.family_circles 
FOR SELECT 
USING (
  owner_id = auth.uid() 
  OR id IN (
    SELECT circle_id 
    FROM public.circle_memberships 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

-- Recreate circle_memberships SELECT policy without circular reference
CREATE POLICY "Users can view memberships in their circles" 
ON public.circle_memberships 
FOR SELECT 
USING (
  -- User can see their own membership
  user_id = auth.uid() 
  OR 
  -- Circle owners can see all memberships in their circles
  circle_id IN (
    SELECT id 
    FROM public.family_circles 
    WHERE owner_id = auth.uid()
  )
);