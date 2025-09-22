-- Create a helper to reliably fetch provisioned individuals by the current user
CREATE OR REPLACE FUNCTION public.get_my_provisioned_individuals()
RETURNS TABLE(user_id uuid, first_name text, status invite_status)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ac.individual_id as user_id,
    COALESCE(p.first_name, 'Unknown Individual') as first_name,
    ac.status
  FROM public.account_claims ac
  LEFT JOIN public.profiles p ON p.user_id = ac.individual_id
  WHERE ac.provisioner_id = auth.uid();
$$;