-- Drop the existing function and recreate with supporter_setup_token
DROP FUNCTION IF EXISTS public.get_invite_token_by_id_secure(uuid);

CREATE OR REPLACE FUNCTION public.get_invite_token_by_id_secure(invite_id uuid)
 RETURNS TABLE(
   individual_id uuid, 
   invite_token text, 
   invitee_email text, 
   invitee_name text, 
   inviter_id uuid, 
   message text,
   supporter_setup_token text
 )
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    si.individual_id,
    si.invite_token,
    si.invitee_email,
    si.invitee_name,
    si.inviter_id,
    si.message,
    si.supporter_setup_token
  FROM public.supporter_invites si
  WHERE si.id = invite_id 
    AND si.status = 'pending'
    AND si.expires_at > now()
    AND si.inviter_id = auth.uid();
$function$