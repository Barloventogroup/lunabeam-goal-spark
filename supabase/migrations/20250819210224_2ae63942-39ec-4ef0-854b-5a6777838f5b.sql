-- Fix security warnings by setting search_path on functions

CREATE OR REPLACE FUNCTION public.get_user_owned_circles()
RETURNS TABLE(circle_id uuid) AS $$
  SELECT id FROM public.family_circles WHERE owner_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE
SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_user_member_circles()
RETURNS TABLE(circle_id uuid) AS $$
  SELECT circle_id FROM public.circle_memberships 
  WHERE user_id = auth.uid() AND status = 'active';
$$ LANGUAGE SQL SECURITY DEFINER STABLE
SET search_path = public;

-- Also fix the existing update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;