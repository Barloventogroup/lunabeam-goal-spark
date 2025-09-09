-- Fix the security definer view issue by dropping it and using functions instead
DROP VIEW IF EXISTS public.my_received_invites;

-- Fix search path for functions to be immutable
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
SET search_path = 'public'
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
    AND i.individual_id = auth.uid()
    AND i.status = 'pending'
    AND i.expires_at > now();
$$;

-- Fix search path for get_invite_by_token function
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
SET search_path = 'public'
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

-- Fix search path for get_my_received_invites function
CREATE OR REPLACE FUNCTION public.get_my_received_invites()
RETURNS TABLE(
  id uuid,
  role user_role,
  permission_level permission_level,
  invitee_name text,
  status invite_status,
  expires_at timestamp with time zone,
  created_at timestamp with time zone,
  message text,
  masked_email text,
  inviter_name text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    i.id,
    i.role,
    i.permission_level,
    i.invitee_name,
    i.status,
    i.expires_at,
    i.created_at,
    i.message,
    CASE 
      WHEN LENGTH(i.invitee_email) > 0 THEN 
        SUBSTRING(i.invitee_email, 1, 1) || '***@' || SPLIT_PART(i.invitee_email, '@', 2)
      ELSE NULL
    END as masked_email,
    COALESCE(p.first_name, 'Someone') as inviter_name
  FROM public.supporter_invites i
  LEFT JOIN public.profiles p ON p.user_id = i.inviter_id
  WHERE i.individual_id = auth.uid();
$$;