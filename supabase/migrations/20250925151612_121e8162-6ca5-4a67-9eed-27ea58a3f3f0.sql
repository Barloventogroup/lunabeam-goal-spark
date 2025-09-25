-- Fix the handle_new_user trigger to include all required fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Check if this is a claimed account (has claim token in metadata)
  IF NEW.raw_user_meta_data ? 'claim_token' OR NEW.raw_user_meta_data ? 'magic_link_token' THEN
    -- This is a claimed account - needs password setup
    INSERT INTO public.profiles (
      user_id, 
      first_name, 
      comm_pref,
      password_set, 
      authentication_status, 
      account_status,
      user_type,
      onboarding_complete
    )
    VALUES (
      NEW.id, 
      COALESCE(NEW.raw_user_meta_data ->> 'first_name', 'User'),
      'text',  -- Required field
      false,  -- Claimed accounts need to set password
      'pending',  -- Still pending authentication
      'pending_user_consent',
      'individual',
      false
    );
  ELSE
    -- This is a regular signup - password already set during signup
    INSERT INTO public.profiles (
      user_id, 
      first_name, 
      comm_pref,
      password_set, 
      authentication_status, 
      account_status,
      user_type,
      onboarding_complete
    )
    VALUES (
      NEW.id, 
      COALESCE(NEW.raw_user_meta_data ->> 'first_name', 'User'),
      'text',  -- Required field
      true,   -- Regular signup users have already set their password
      'authenticated',  -- They are fully authenticated
      'active',
      'individual',
      false   -- Still need to complete onboarding
    );
  END IF;
  
  RETURN NEW;
END;
$$;