-- 1. Add idempotency check to provision_individual_direct function
CREATE OR REPLACE FUNCTION public.provision_individual_direct(
  p_first_name TEXT,
  p_user_type TEXT DEFAULT 'individual'
)
RETURNS TABLE(individual_id UUID, placeholder_email TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current_user UUID := auth.uid();
  _new_user_id UUID;
  _placeholder_email TEXT;
  _existing_id UUID;
  _existing_email TEXT;
BEGIN
  IF _current_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- IDEMPOTENCY CHECK: Return existing provisional account if created recently
  SELECT p.user_id, p.email INTO _existing_id, _existing_email
  FROM public.profiles p
  JOIN public.supporters s ON p.user_id = s.individual_id
  WHERE s.supporter_id = _current_user
    AND s.is_provisioner = true
    AND p.first_name = p_first_name
    AND p.account_status = 'active'
    AND p.authentication_status = 'pending'
    AND p.created_at > now() - interval '2 minutes'
  ORDER BY p.created_at DESC
  LIMIT 1;

  -- If found within 2 minutes, return existing account (idempotent)
  IF _existing_id IS NOT NULL THEN
    RAISE NOTICE 'Returning existing provisional account: %', _existing_id;
    RETURN QUERY SELECT _existing_id, _existing_email;
    RETURN;
  END IF;

  -- Generate new UUID and placeholder email
  _new_user_id := gen_random_uuid();
  _placeholder_email := 'temp-' || _new_user_id || '@pending.lunabeam.com';

  -- Create user in auth.users
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role,
    created_at,
    updated_at
  ) VALUES (
    _new_user_id,
    '00000000-0000-0000-0000-000000000000',
    _placeholder_email,
    crypt('temp-password-' || _new_user_id, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    json_build_object('first_name', p_first_name)::jsonb,
    'authenticated',
    'authenticated',
    now(),
    now()
  );

  -- Create profile
  INSERT INTO public.profiles (
    user_id,
    first_name,
    email,
    user_type,
    account_status,
    authentication_status,
    onboarding_complete,
    comm_pref,
    created_by_supporter
  ) VALUES (
    _new_user_id,
    p_first_name,
    _placeholder_email,
    p_user_type,
    'active',
    'pending',
    false,
    'text',
    _current_user
  );

  -- Create supporter relationship with unique constraint handling
  INSERT INTO public.supporters (
    individual_id,
    supporter_id,
    role,
    permission_level,
    is_admin,
    is_provisioner
  ) VALUES (
    _new_user_id,
    _current_user,
    'supporter',
    'admin',
    true,
    true
  )
  ON CONFLICT (individual_id, supporter_id) DO NOTHING;

  RAISE NOTICE 'Created new provisional account: %', _new_user_id;
  RETURN QUERY SELECT _new_user_id, _placeholder_email;
END;
$$;

-- 2. Add unique constraint to prevent duplicate supporter relationships
ALTER TABLE public.supporters 
DROP CONSTRAINT IF EXISTS supporters_individual_supporter_unique;

ALTER TABLE public.supporters 
ADD CONSTRAINT supporters_individual_supporter_unique 
UNIQUE (individual_id, supporter_id);

-- 3. Cleanup existing duplicate provisional accounts
-- Find and delete duplicates, keeping only the first created account
WITH duplicates AS (
  SELECT 
    p1.user_id,
    p1.first_name,
    p1.created_by_supporter,
    p1.created_at,
    ROW_NUMBER() OVER (
      PARTITION BY p1.first_name, p1.created_by_supporter 
      ORDER BY p1.created_at ASC
    ) as rn
  FROM public.profiles p1
  WHERE p1.created_by_supporter IS NOT NULL
    AND p1.account_status = 'active'
    AND p1.authentication_status = 'pending'
    AND p1.email LIKE 'temp-%@pending.lunabeam.com'
    AND EXISTS (
      SELECT 1 FROM public.profiles p2
      WHERE p2.first_name = p1.first_name
        AND p2.created_by_supporter = p1.created_by_supporter
        AND p2.user_id != p1.user_id
        AND ABS(EXTRACT(EPOCH FROM (p2.created_at - p1.created_at))) < 10
    )
),
deleted_users AS (
  DELETE FROM auth.users
  WHERE id IN (
    SELECT user_id FROM duplicates WHERE rn > 1
  )
  RETURNING id
)
SELECT COUNT(*) as deleted_count FROM deleted_users;