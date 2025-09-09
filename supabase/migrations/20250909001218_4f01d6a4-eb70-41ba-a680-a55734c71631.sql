-- Fix 1: Harden RLS policies for rewards table
DROP POLICY IF EXISTS "Users can view all active rewards" ON public.rewards;

CREATE POLICY "Users can view rewards from their supporters" ON public.rewards
FOR SELECT USING (
  owner_id IN (
    SELECT supporter_id FROM public.supporters 
    WHERE individual_id = auth.uid()
  )
);

CREATE POLICY "Reward owners can view their own rewards" ON public.rewards
FOR SELECT USING (owner_id = auth.uid());

-- Fix 2: Add RLS to supporter_invite_safe_metadata view
ALTER VIEW public.supporter_invite_safe_metadata SET (security_barrier = true);

-- Fix 3: Harden account claim function - require authentication
CREATE OR REPLACE FUNCTION public.claim_account(_claim_token text, _passcode text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _claim_record RECORD;
  _current_user_id UUID := auth.uid();
  _result JSON;
BEGIN
  -- Require authentication
  IF _current_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Authentication required');
  END IF;

  -- Find and validate claim
  SELECT * INTO _claim_record
  FROM account_claims 
  WHERE claim_token = _claim_token 
    AND claim_passcode = _passcode
    AND status = 'pending'
    AND expires_at > now()
    AND individual_id = _current_user_id;  -- Ensure user can only claim their own account
  
  IF _claim_record IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or expired claim');
  END IF;
  
  -- Update account claim status
  UPDATE account_claims 
  SET status = 'accepted', claimed_at = now()
  WHERE id = _claim_record.id;
  
  -- Update profile status
  UPDATE profiles 
  SET account_status = 'user_claimed', claimed_at = now()
  WHERE user_id = _claim_record.individual_id;
  
  -- Remove provisioner status from the supporter
  UPDATE supporters 
  SET is_provisioner = false
  WHERE individual_id = _claim_record.individual_id 
    AND supporter_id = _claim_record.provisioner_id;
  
  RETURN json_build_object('success', true, 'individual_id', _claim_record.individual_id);
END;
$function$;

-- Fix 4: Add rate limiting table for claim attempts
CREATE TABLE IF NOT EXISTS public.claim_attempt_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_token text NOT NULL,
  attempted_at timestamp with time zone DEFAULT now(),
  ip_address text,
  user_agent text
);

-- Enable RLS on claim attempt log
ALTER TABLE public.claim_attempt_log ENABLE ROW LEVEL SECURITY;

-- Only allow system to insert claim attempts
CREATE POLICY "System can log claim attempts" ON public.claim_attempt_log
FOR INSERT WITH CHECK (true);

-- Fix 5: Update redemption points policy to be more restrictive
DROP POLICY IF EXISTS "Users can create redemption requests" ON public.redemptions;

CREATE POLICY "Users can create redemption requests" ON public.redemptions
FOR INSERT WITH CHECK (
  user_id = auth.uid() 
  AND status = 'pending'
  AND reward_id IN (
    SELECT r.id FROM public.rewards r
    JOIN public.supporters s ON r.owner_id = s.supporter_id
    WHERE s.individual_id = auth.uid() AND r.is_active = true
  )
);