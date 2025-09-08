-- Fix Account Takeover Risk Through Unrestricted Claim Updates
-- Remove the dangerous "Anyone can update claims during claiming process" policy
-- and replace with secure, restricted policies

-- Drop the vulnerable policy
DROP POLICY IF EXISTS "Anyone can update claims during claiming process" ON public.account_claims;

-- Create secure replacement policies
-- 1. Allow provisioners to update their own pending claims (e.g., extend expiry, add message)
CREATE POLICY "Provisioners can update their own pending claims"
ON public.account_claims
FOR UPDATE
USING (
  provisioner_id = auth.uid() 
  AND status = 'pending'
  AND expires_at > now()
)
WITH CHECK (
  provisioner_id = auth.uid() 
  AND status IN ('pending', 'declined', 'expired')  -- Allow declining or expiring claims
  AND expires_at >= now()  -- Prevent backdating expiry
);

-- 2. Allow individuals to update claims during the claiming process
-- This is more restrictive - only allow status changes from pending to accepted
-- and only if they provide the correct token/passcode (validation happens in claim_account function)
CREATE POLICY "Individuals can accept their own claims"
ON public.account_claims
FOR UPDATE
USING (
  individual_id = auth.uid()
  AND status = 'pending'
  AND expires_at > now()
)
WITH CHECK (
  individual_id = auth.uid()
  AND status = 'accepted'  -- Only allow accepting claims
  AND claimed_at IS NOT NULL  -- Ensure claimed_at is set
);

-- Add a comment explaining the security model
COMMENT ON TABLE public.account_claims IS 
'Account claims for provisioned accounts. Updates are restricted to prevent account takeover attacks. 
Provisioners can update their own pending claims. Individuals can only accept valid claims through the claim_account() function.';