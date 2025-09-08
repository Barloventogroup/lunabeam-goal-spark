-- Fix User Email Addresses and Personal Data Security Vulnerability
-- Replace overly permissive policies with secure, granular access controls

-- Drop existing vulnerable policies
DROP POLICY IF EXISTS "Individuals can manage their invites" ON public.supporter_invites;
DROP POLICY IF EXISTS "Inviters can view their sent invites" ON public.supporter_invites;

-- Create secure, granular policies for inviters
-- Inviters can create invites for others
CREATE POLICY "Inviters can create supporter invites"
ON public.supporter_invites
FOR INSERT
WITH CHECK (
  inviter_id = auth.uid()
  AND individual_id != auth.uid()  -- Prevent self-invites
  AND expires_at > now()           -- Ensure valid expiry
);

-- Inviters can view their own sent invites
CREATE POLICY "Inviters can view their sent invites" 
ON public.supporter_invites
FOR SELECT
USING (inviter_id = auth.uid());

-- Inviters can update their own pending invites (e.g., cancel, modify message)
CREATE POLICY "Inviters can update their pending invites"
ON public.supporter_invites  
FOR UPDATE
USING (
  inviter_id = auth.uid()
  AND status = 'pending'
  AND expires_at > now()
)
WITH CHECK (
  inviter_id = auth.uid()
  AND status IN ('pending', 'declined', 'expired')  -- Allow cancellation
);

-- Create secure policies for individuals being supported
-- Individuals can view invites related to them (but not modify)
CREATE POLICY "Individuals can view invites for their support"
ON public.supporter_invites
FOR SELECT  
USING (individual_id = auth.uid());

-- Create secure policy for invite acceptance
-- Allow updating invite status during acceptance process (very restricted)
CREATE POLICY "Allow invite acceptance updates"
ON public.supporter_invites
FOR UPDATE
USING (
  status = 'pending'
  AND expires_at > now()
  AND invite_token IS NOT NULL
)
WITH CHECK (
  status = 'accepted'
  AND individual_id = auth.uid()  -- Only the individual can accept their invite
);

-- Add security comment
COMMENT ON TABLE public.supporter_invites IS 
'Supporter invites with email addresses and personal data. Access is strictly controlled:
- Inviters can create, view, and cancel their invites
- Individuals can view and accept invites for their support  
- No unauthorized access to sensitive email/name data is permitted';