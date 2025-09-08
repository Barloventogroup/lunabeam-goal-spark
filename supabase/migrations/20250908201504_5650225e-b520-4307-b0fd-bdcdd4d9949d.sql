-- Harden supporter_invites data visibility: isolate emails/tokens via column-level privileges
-- 1) Revoke all default privileges for anon/authenticated/public
REVOKE ALL ON TABLE public.supporter_invites FROM anon;
REVOKE ALL ON TABLE public.supporter_invites FROM authenticated;
REVOKE ALL ON TABLE public.supporter_invites FROM PUBLIC;

-- 2) Re-grant only the minimal required privileges to authenticated
-- Note: RLS policies already restrict rows to inviter_id = auth.uid().
GRANT INSERT, UPDATE, DELETE ON public.supporter_invites TO authenticated;

-- 3) Grant SELECT only on NON-sensitive columns (exclude invitee_email and invite_token)
GRANT SELECT (
  id,
  individual_id,
  inviter_id,
  role,
  permission_level,
  specific_goals,
  invitee_name,
  message,
  status,
  expires_at,
  created_at
) ON public.supporter_invites TO authenticated;

-- 4) (Optional safety) Ensure anon has no access
REVOKE SELECT ON TABLE public.supporter_invites FROM anon;

-- 5) Keep access to safe metadata via existing view/function
--    supporter_invite_safe_metadata view and get_my_sent_invites() function remain the primary
--    interfaces for reading invite info without exposing sensitive fields.
GRANT SELECT ON public.supporter_invite_safe_metadata TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_sent_invites() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_invite_by_token(text) TO authenticated;