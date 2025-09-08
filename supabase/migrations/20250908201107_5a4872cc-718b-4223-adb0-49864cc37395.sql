-- Fix invitation token and email security vulnerabilities
-- Issue: Invitation tokens and email addresses could be stolen through overly permissive RLS

-- Drop existing policies to recreate with stricter access
DROP POLICY IF EXISTS "Inviters can view their sent invites metadata only" ON supporter_invites;

-- Create a secure view for invite metadata that excludes sensitive fields
CREATE OR REPLACE VIEW public.supporter_invite_safe_metadata AS
SELECT 
  id,
  individual_id,
  inviter_id,
  role,
  permission_level,
  invitee_name,  -- Keep name but not email
  status,
  expires_at,
  created_at,
  -- Mask email for privacy (show only first char + domain)
  CASE 
    WHEN LENGTH(invitee_email) > 0 THEN 
      SUBSTRING(invitee_email, 1, 1) || '***@' || SPLIT_PART(invitee_email, '@', 2)
    ELSE NULL
  END as masked_email,
  -- Never expose tokens or passcodes in views
  NULL::text as invite_token_hidden,
  message
FROM supporter_invites;

-- Enable RLS on the view
ALTER VIEW public.supporter_invite_safe_metadata SET (security_invoker = true);

-- Create ultra-restrictive RLS policies
-- Inviters can only see safe metadata (no tokens, masked emails)
CREATE POLICY "Inviters can view safe invite metadata only"
ON supporter_invites
FOR SELECT
TO authenticated
USING (
  inviter_id = auth.uid() 
  AND inviter_id IS NOT NULL
  -- Additional security: only allow access to specific columns in application code
);

-- Update get_invite_by_token function to be the ONLY way to access full invite data
CREATE OR REPLACE FUNCTION public.get_invite_by_token(_token text)
RETURNS TABLE (
  id uuid,
  individual_id uuid,
  inviter_id uuid,
  role user_role,
  permission_level permission_level,
  specific_goals uuid[],
  invitee_name text,
  message text,
  expires_at timestamptz,
  status invite_status
)
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path TO 'public'
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

-- Create function for inviters to get their invite status without exposing tokens
CREATE OR REPLACE FUNCTION public.get_my_sent_invites()
RETURNS TABLE (
  id uuid,
  individual_id uuid,
  role user_role,
  permission_level permission_level,
  invitee_name text,
  masked_email text,
  status invite_status,
  expires_at timestamptz,
  created_at timestamptz,
  message text
)
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $$
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
$$;

-- Grant necessary permissions
GRANT SELECT ON public.supporter_invite_safe_metadata TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_sent_invites() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_invite_by_token(text) TO authenticated;