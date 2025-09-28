-- Idempotent approval functions for supporter requests
-- 1) Make approve_supporter_request_by_email_v3 idempotent
CREATE OR REPLACE FUNCTION public.approve_supporter_request_by_email_v3(
  p_individual_id uuid,
  p_invitee_email text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _current_user uuid := auth.uid();
  _request_record public.supporter_invites%ROWTYPE;
  _existing_pending uuid;
  _new_id uuid;
  _token text;
  _norm_email text := lower(trim(p_invitee_email));
BEGIN
  IF _current_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verify current user is admin for this individual
  IF NOT EXISTS (
    SELECT 1 FROM public.supporters s
    WHERE s.individual_id = p_individual_id
      AND s.supporter_id = _current_user
      AND s.is_admin = true
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Must be admin for this individual';
  END IF;

  -- Idempotent behavior: if a pending invite already exists for this email, return it
  SELECT si.id INTO _existing_pending
  FROM public.supporter_invites si
  WHERE si.individual_id = p_individual_id
    AND lower(trim(si.invitee_email)) = _norm_email
    AND si.status = 'pending'
  ORDER BY si.created_at DESC
  LIMIT 1;

  IF _existing_pending IS NOT NULL THEN
    RETURN _existing_pending;
  END IF;

  -- Find the latest pending_admin_approval request for this email
  SELECT * INTO _request_record
  FROM public.supporter_invites si
  WHERE si.individual_id = p_individual_id
    AND lower(trim(si.invitee_email)) = _norm_email
    AND si.status = 'pending_admin_approval'
  ORDER BY si.created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or not pending approval';
  END IF;

  -- Generate a URL-safe token
  _token := substring(replace((gen_random_uuid()::text || gen_random_uuid()::text), '-', '') from 1 for 24);

  -- Create the actual invite copying original values, status set to 'pending'
  INSERT INTO public.supporter_invites (
    id,
    individual_id,
    inviter_id,
    invitee_email,
    invitee_name,
    role,
    permission_level,
    specific_goals,
    invite_token,
    message,
    expires_at,
    status,
    requires_approval,
    requested_by
  ) VALUES (
    gen_random_uuid(),
    _request_record.individual_id,
    _request_record.inviter_id,
    trim(_request_record.invitee_email),
    _request_record.invitee_name,
    _request_record.role,
    _request_record.permission_level,
    COALESCE(_request_record.specific_goals, ARRAY[]::uuid[]),
    _token,
    _request_record.message,
    now() + '7 days'::interval,
    'pending',
    false,
    NULL
  ) RETURNING supporter_invites.id INTO _new_id;

  -- Best-effort cleanup of original pending_admin_approval requests for this email
  BEGIN
    DELETE FROM public.supporter_invites si
    WHERE si.individual_id = p_individual_id
      AND lower(trim(si.invitee_email)) = _norm_email
      AND si.status = 'pending_admin_approval';
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Skipping duplicate cleanup: %', SQLERRM;
  END;

  RETURN _new_id;
END;
$$;

-- 2) Create approve_supporter_request_secure_v3 with idempotency
CREATE OR REPLACE FUNCTION public.approve_supporter_request_secure_v3(
  p_request_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _current_user uuid := auth.uid();
  _request_record public.supporter_invites%ROWTYPE;
  _existing_pending uuid;
  _new_id uuid;
  _token text;
  _norm_email text;
BEGIN
  IF _current_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Load the request record regardless of status to support idempotency
  SELECT * INTO _request_record
  FROM public.supporter_invites
  WHERE id = p_request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  -- Verify current user is admin for this individual
  IF NOT EXISTS (
    SELECT 1 FROM public.supporters s
    WHERE s.individual_id = _request_record.individual_id
      AND s.supporter_id = _current_user
      AND s.is_admin = true
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Must be admin for this individual';
  END IF;

  _norm_email := lower(trim(_request_record.invitee_email));

  -- Idempotent behavior: if a pending invite already exists for this email, return it
  SELECT si.id INTO _existing_pending
  FROM public.supporter_invites si
  WHERE si.individual_id = _request_record.individual_id
    AND lower(trim(si.invitee_email)) = _norm_email
    AND si.status = 'pending'
  ORDER BY si.created_at DESC
  LIMIT 1;

  IF _existing_pending IS NOT NULL THEN
    RETURN _existing_pending;
  END IF;

  -- If request is not pending_admin_approval anymore, treat as already handled
  IF _request_record.status IS DISTINCT FROM 'pending_admin_approval'::invite_status THEN
    RAISE EXCEPTION 'Request not found or not pending approval';
  END IF;

  -- Generate a URL-safe token
  _token := substring(replace((gen_random_uuid()::text || gen_random_uuid()::text), '-', '') from 1 for 24);

  -- Create the actual invite copying original values, status set to 'pending'
  INSERT INTO public.supporter_invites (
    id,
    individual_id,
    inviter_id,
    invitee_email,
    invitee_name,
    role,
    permission_level,
    specific_goals,
    invite_token,
    message,
    expires_at,
    status,
    requires_approval,
    requested_by
  ) VALUES (
    gen_random_uuid(),
    _request_record.individual_id,
    _request_record.inviter_id,
    trim(_request_record.invitee_email),
    _request_record.invitee_name,
    _request_record.role,
    _request_record.permission_level,
    COALESCE(_request_record.specific_goals, ARRAY[]::uuid[]),
    _token,
    _request_record.message,
    now() + '7 days'::interval,
    'pending',
    false,
    NULL
  ) RETURNING supporter_invites.id INTO _new_id;

  -- Cleanup the original request and potential duplicates (best-effort)
  BEGIN
    DELETE FROM public.supporter_invites si
    WHERE si.individual_id = _request_record.individual_id
      AND (si.id = p_request_id OR lower(trim(si.invitee_email)) = _norm_email)
      AND si.status = 'pending_admin_approval';
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Skipping cleanup: %', SQLERRM;
  END;

  RETURN _new_id;
END;
$$;