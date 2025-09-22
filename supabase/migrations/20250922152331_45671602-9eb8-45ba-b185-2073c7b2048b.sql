-- Create a helper function to allow supporters/provisioners to fetch profiles they created on-behalf
-- This avoids exposing the entire profiles table via RLS and returns minimal fields only
CREATE OR REPLACE FUNCTION public.get_profiles_created_by_me()
RETURNS TABLE(user_id uuid, first_name text, avatar_url text, account_status public.account_status)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.first_name, p.avatar_url, p.account_status
  FROM public.profiles p
  WHERE p.created_by_supporter = auth.uid();
$$;