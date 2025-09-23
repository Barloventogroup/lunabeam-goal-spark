-- Fix ambiguous column reference in check_user_permission_v2 function
CREATE OR REPLACE FUNCTION public.check_user_permission_v2(_individual_id uuid, _action text, _goal_id uuid DEFAULT NULL::uuid, _scope text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _current_user_id UUID := auth.uid();
  _user_role user_role;
  _permission_level permission_level;
  _is_admin BOOLEAN := false;
  _is_provisioner BOOLEAN := false;
  _account_status account_status;
  _has_consent BOOLEAN := false;
BEGIN
  -- Check if user is the individual themselves
  IF _current_user_id = _individual_id THEN
    RETURN true;
  END IF;
  
  -- Get individual's account status
  SELECT p.account_status INTO _account_status 
  FROM public.profiles p WHERE p.user_id = _individual_id;
  
  -- Get supporter relationship - fix ambiguous column reference
  SELECT s.role, s.permission_level, s.is_admin, s.is_provisioner
  INTO _user_role, _permission_level, _is_admin, _is_provisioner
  FROM public.supporters s 
  WHERE s.individual_id = _individual_id AND s.supporter_id = _current_user_id;
  
  -- If no relationship found, deny access
  IF _user_role IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check consent for sensitive actions
  IF _action IN ('view_as_user', 'export_reports') THEN
    SELECT uc.granted INTO _has_consent
    FROM public.user_consents uc
    WHERE uc.individual_id = _individual_id 
    AND uc.admin_id = _current_user_id 
    AND uc.consent_type = _action
    AND uc.granted = true
    AND (uc.expires_at IS NULL OR uc.expires_at > now());
  END IF;
  
  -- Permission logic based on action
  CASE _action
    -- Goal management
    WHEN 'view_goals' THEN
      RETURN _permission_level IN ('viewer', 'collaborator') OR _is_admin OR
             (_user_role = 'friend' AND _goal_id = ANY(
               SELECT unnest(s2.specific_goals) FROM public.supporters s2
               WHERE s2.individual_id = _individual_id AND s2.supporter_id = _current_user_id
             ));
    
    WHEN 'create_goals', 'delete_goals' THEN
      RETURN _is_admin OR _is_provisioner;
    
    WHEN 'edit_goals', 'add_steps', 'mark_complete' THEN
      RETURN _permission_level = 'collaborator' OR _is_admin OR _is_provisioner;
    
    WHEN 'suggest_goals', 'suggest_steps' THEN
      RETURN _user_role IN ('supporter', 'provider') AND _permission_level IN ('viewer', 'collaborator');
    
    -- Reward management
    WHEN 'manage_rewards', 'approve_redemptions' THEN
      RETURN _is_admin;
    
    WHEN 'view_rewards', 'request_redemption' THEN
      RETURN _permission_level IN ('viewer', 'collaborator') OR _is_admin;
    
    -- Team management
    WHEN 'invite_members', 'remove_members', 'change_roles', 'grant_admin' THEN
      RETURN _is_admin;
    
    -- Profile and privacy
    WHEN 'edit_profile', 'adjust_privacy', 'adjust_sharing' THEN
      RETURN _is_admin OR _is_provisioner;
    
    -- Reporting and exports
    WHEN 'export_reports' THEN
      IF _scope = 'own' THEN
        RETURN true; -- Individual can export their own
      ELSIF _scope = 'limited' THEN
        RETURN _user_role = 'provider' AND _has_consent;
      ELSIF _scope = 'full' THEN
        RETURN _is_admin AND _has_consent;
      ELSE
        RETURN false;
      END IF;
    
    -- Sensitive actions requiring consent
    WHEN 'view_as_user' THEN
      RETURN _is_admin AND _has_consent;
    
    -- Support actions (cheer, encourage)
    WHEN 'cheer_steps', 'encourage' THEN
      RETURN _user_role IN ('supporter', 'friend', 'provider') OR _is_admin;
    
    -- Provider-specific actions
    WHEN 'view_reflections' THEN
      IF _user_role = 'provider' THEN
        -- Providers need explicit consent for reflections
        SELECT uc2.granted INTO _has_consent
        FROM public.user_consents uc2
        WHERE uc2.individual_id = _individual_id 
        AND uc2.admin_id = _current_user_id 
        AND uc2.consent_type = 'provider_reflections'
        AND uc2.granted = true;
        RETURN _has_consent;
      ELSE
        RETURN _is_admin OR _permission_level = 'collaborator';
      END IF;
    
    ELSE
      RETURN false;
  END CASE;
END;
$function$;