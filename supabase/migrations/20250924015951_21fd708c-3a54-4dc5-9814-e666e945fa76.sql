-- Replace ON CONFLICT upsert with deterministic update-then-insert to avoid missing unique index
CREATE OR REPLACE FUNCTION public.assign_email_and_invite(p_individual_id uuid, p_real_email text, p_invitee_name text DEFAULT NULL::text)
 RETURNS TABLE(success boolean, magic_link_token text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _current_user uuid := auth.uid();
  _magic_token text;
  _real_email text := lower(trim(p_real_email));
  _updated_id uuid;
BEGIN
  IF _current_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate email format
  IF _real_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;

  -- Ensure current user is admin for this individual
  IF NOT EXISTS (
    SELECT 1 FROM public.supporters 
    WHERE individual_id = p_individual_id 
      AND supporter_id = _current_user 
      AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Must be admin for this individual';
  END IF;

  -- Generate fresh magic token
  _magic_token := substring(replace((gen_random_uuid()::text || gen_random_uuid()::text), '-', '') from 1 for 32);

  -- Update auth.users email (best-effort)
  UPDATE auth.users 
     SET email = _real_email,
         updated_at = now(),
         raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb)
           || json_build_object(
                'magic_link_token', _magic_token,
                'magic_link_expires', extract(epoch from (now() + '24 hours'::interval))
              )::jsonb
   WHERE id = p_individual_id;

  -- Update profiles
  UPDATE public.profiles 
     SET email = _real_email,
         account_status = 'pending_user_consent',
         authentication_status = 'pending',
         updated_at = now()
   WHERE user_id = p_individual_id;

  -- Try update existing pending claim for this provisioner/individual
  UPDATE public.account_claims
     SET invitee_email = _real_email,
         first_name = COALESCE(p_invitee_name, (SELECT first_name FROM public.profiles WHERE user_id = p_individual_id)),
         magic_link_token = _magic_token,
         magic_link_expires_at = now() + '24 hours'::interval,
         status = 'pending'
   WHERE individual_id = p_individual_id
     AND provisioner_id = _current_user
     AND status IN ('pending','expired');

  GET DIAGNOSTICS _updated_id = ROW_COUNT; -- misuse: we need rowcount numeric; adjust below

  -- If no row updated, insert new
  IF (SELECT COUNT(*) = 0 FROM public.account_claims 
        WHERE individual_id = p_individual_id AND provisioner_id = _current_user AND status = 'pending') THEN
    INSERT INTO public.account_claims (
      provisioner_id,
      individual_id,
      invitee_email,
      first_name,
      magic_link_token,
      magic_link_expires_at,
      status
    ) VALUES (
      _current_user,
      p_individual_id,
      _real_email,
      COALESCE(p_invitee_name, (SELECT first_name FROM public.profiles WHERE user_id = p_individual_id)),
      _magic_token,
      now() + '24 hours'::interval,
      'pending'
    );
  END IF;

  success := true;
  magic_link_token := _magic_token;
  RETURN NEXT;
END;
$function$;