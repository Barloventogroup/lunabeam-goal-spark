-- Update claim_account to bind claim to current auth user
CREATE OR REPLACE FUNCTION public.claim_account(_claim_token text, _passcode text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _claim_record RECORD;
  _current_user_id UUID := auth.uid();
BEGIN
  -- Require authentication
  IF _current_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Authentication required');
  END IF;

  -- Find and validate claim (do NOT require individual_id to match yet)
  SELECT * INTO _claim_record
  FROM account_claims 
  WHERE claim_token = _claim_token 
    AND claim_passcode = _passcode
    AND status = 'pending'
    AND expires_at > now();
  
  IF _claim_record IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or expired claim');
  END IF;
  
  -- Migrate any supporter relationships from placeholder individual to the real user
  -- (in case a provisional relationship was established)
  UPDATE supporters 
  SET individual_id = _current_user_id
  WHERE individual_id = _claim_record.individual_id;
  
  -- Update the account claim to be accepted and rebind to the actual user id
  UPDATE account_claims 
  SET status = 'accepted', claimed_at = now(), individual_id = _current_user_id
  WHERE id = _claim_record.id;
  
  -- Ensure profile for current user reflects claimed status
  INSERT INTO profiles (user_id, first_name, onboarding_complete, comm_pref, account_status, claimed_at)
  VALUES (_current_user_id, COALESCE(NULLIF(TRIM(_claim_record.first_name), ''), 'User'), false, 'text', 'user_claimed', now())
  ON CONFLICT (user_id) DO UPDATE SET 
    account_status = 'user_claimed',
    claimed_at = now(),
    updated_at = now(),
    first_name = COALESCE(profiles.first_name, COALESCE(NULLIF(TRIM(_claim_record.first_name), ''), 'User'));
  
  -- If there was a provisioner relationship recorded, remove provisioner flag for that supporter mapped to the new individual id
  UPDATE supporters 
  SET is_provisioner = false
  WHERE individual_id = _current_user_id 
    AND supporter_id = _claim_record.provisioner_id;
  
  RETURN json_build_object('success', true, 'individual_id', _current_user_id);
END;
$function$;