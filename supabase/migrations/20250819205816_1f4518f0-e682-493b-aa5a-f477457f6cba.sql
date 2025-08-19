-- Fix infinite recursion by using security definer functions

-- Drop the problematic policies that create circular references
DROP POLICY IF EXISTS "Circle owners can manage memberships" ON public.circle_memberships;
DROP POLICY IF EXISTS "Users can view memberships in their circles" ON public.circle_memberships;
DROP POLICY IF EXISTS "Users can view circles they own or are members of" ON public.family_circles;

-- Create security definer functions to break the circular dependency
CREATE OR REPLACE FUNCTION public.get_user_owned_circles()
RETURNS TABLE(circle_id uuid) AS $$
  SELECT id FROM public.family_circles WHERE owner_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_user_member_circles()
RETURNS TABLE(circle_id uuid) AS $$
  SELECT circle_id FROM public.circle_memberships 
  WHERE user_id = auth.uid() AND status = 'active';
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Recreate family_circles SELECT policy using security definer function
CREATE POLICY "Users can view circles they own or are members of" 
ON public.family_circles 
FOR SELECT 
USING (
  owner_id = auth.uid() 
  OR id IN (SELECT circle_id FROM public.get_user_member_circles())
);

-- Recreate circle_memberships policies using security definer function
CREATE POLICY "Circle owners can manage memberships" 
ON public.circle_memberships 
FOR ALL 
USING (
  circle_id IN (SELECT circle_id FROM public.get_user_owned_circles())
);

CREATE POLICY "Users can view memberships in their circles" 
ON public.circle_memberships 
FOR SELECT 
USING (
  user_id = auth.uid() 
  OR circle_id IN (SELECT circle_id FROM public.get_user_owned_circles())
);