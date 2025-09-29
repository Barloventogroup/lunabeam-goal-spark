-- Drop existing function first
DROP FUNCTION IF EXISTS public.get_supporter_invite_public(text);

-- Recreate with invite_token included
CREATE OR REPLACE FUNCTION public.get_supporter_invite_public(p_token text)
 RETURNS TABLE(
   id uuid,
   individual_id uuid,
   invitee_email text,
   invitee_name text,
   role user_role,
   permission_level permission_level,
   message text,
   supporter_setup_token text,
   individual_name text,
   invite_token text
 )
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    si.id,
    si.individual_id,
    si.invitee_email,
    si.invitee_name,
    si.role,
    si.permission_level,
    si.message,
    si.supporter_setup_token,
    p.first_name as individual_name,
    si.invite_token
  FROM public.supporter_invites si
  LEFT JOIN public.profiles p ON p.user_id = si.individual_id
  WHERE (si.supporter_setup_token = p_token OR si.invite_token = p_token)
    AND si.status = 'pending'
    AND si.expires_at > now()
  LIMIT 1;
$function$;