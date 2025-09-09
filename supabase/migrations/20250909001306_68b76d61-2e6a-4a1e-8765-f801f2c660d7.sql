-- Fix remaining function search path issues
CREATE OR REPLACE FUNCTION public.get_user_owned_circles()
RETURNS TABLE(circle_id uuid)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT id FROM public.family_circles WHERE owner_id = auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.get_user_member_circles()
RETURNS TABLE(circle_id uuid)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT circle_id FROM public.circle_memberships 
  WHERE user_id = auth.uid() AND status = 'active';
$function$;

CREATE OR REPLACE FUNCTION public.get_invite_by_token(_token text)
RETURNS TABLE(id uuid, individual_id uuid, inviter_id uuid, role user_role, permission_level permission_level, specific_goals uuid[], invitee_name text, message text, expires_at timestamp with time zone, status invite_status)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_my_sent_invites()
RETURNS TABLE(id uuid, individual_id uuid, role user_role, permission_level permission_level, invitee_name text, masked_email text, status invite_status, expires_at timestamp with time zone, created_at timestamp with time zone, message text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    id,
    individual_id,
    role,
    permission_level,
    invitee_name,
    CASE 
      WHEN LENGTH(invitee_email) > 0 THEN 
        SUBSTRING(invitee_email, 1, 1) || '***@' || SPLIT_PART(invitee_email, '@', 2)
      ELSE NULL
    END as masked_email,
    status,
    expires_at,
    created_at,
    message
  FROM supporter_invites
  WHERE inviter_id = auth.uid();
$function$;