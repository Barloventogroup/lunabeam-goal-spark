-- Create a secure view for invitees that hides sensitive data
-- Views don't need RLS policies, they inherit security from underlying tables
CREATE OR REPLACE VIEW public.my_received_invites AS 
SELECT 
  i.id,
  i.role,
  i.permission_level,
  i.invitee_name,
  i.status,
  i.expires_at,
  i.created_at,
  i.message,
  -- Hide email and token for security
  CASE 
    WHEN LENGTH(i.invitee_email) > 0 THEN 
      SUBSTRING(i.invitee_email, 1, 1) || '***@' || SPLIT_PART(i.invitee_email, '@', 2)
    ELSE NULL
  END as masked_email,
  -- Get inviter name from profiles if available
  COALESCE(p.first_name, 'Someone') as inviter_name
FROM public.supporter_invites i
LEFT JOIN public.profiles p ON p.user_id = i.inviter_id
WHERE i.individual_id = auth.uid();

-- Create a secure function for invitees to get their invite details by token
CREATE OR REPLACE FUNCTION public.get_my_invite_by_token(_token text)
RETURNS TABLE(
  id uuid,
  role user_role,
  permission_level permission_level,
  invitee_name text,
  message text,
  status invite_status,
  expires_at timestamp with time zone,
  inviter_name text,
  masked_email text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    i.id,
    i.role,
    i.permission_level,
    i.invitee_name,
    i.message,
    i.status,
    i.expires_at,
    COALESCE(p.first_name, 'Someone') as inviter_name,
    CASE 
      WHEN LENGTH(i.invitee_email) > 0 THEN 
        SUBSTRING(i.invitee_email, 1, 1) || '***@' || SPLIT_PART(i.invitee_email, '@', 2)
      ELSE NULL
    END as masked_email
  FROM public.supporter_invites i
  LEFT JOIN public.profiles p ON p.user_id = i.inviter_id
  WHERE i.invite_token = _token 
    AND i.individual_id = auth.uid()  -- Ensure user can only access their own invites
    AND i.status = 'pending'
    AND i.expires_at > now();
$$;

-- Update the existing get_invite_by_token function to be more secure
-- Remove email exposure from this function
CREATE OR REPLACE FUNCTION public.get_invite_by_token(_token text)
RETURNS TABLE(
  id uuid, 
  individual_id uuid, 
  inviter_id uuid, 
  role user_role, 
  permission_level permission_level, 
  specific_goals uuid[], 
  invitee_name text, 
  message text, 
  expires_at timestamp with time zone, 
  status invite_status
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    i.id,
    i.individual_id,
    i.inviter_id,
    i.role,
    i.permission_level,
    i.specific_goals,
    i.invitee_name,
    i.message,
    i.expires_at,
    i.status
  FROM public.supporter_invites i
  WHERE i.invite_token = _token 
    AND i.status = 'pending'
    AND i.expires_at > now();
$$;