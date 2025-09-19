-- Fix Permission Model: Separate roles from admin permissions

-- 1. Create new enum for user roles (without 'admin' as a role)
CREATE TYPE public.user_role_fixed AS ENUM ('individual', 'supporter', 'friend', 'provider');

-- 2. Add is_admin column to supporters table
ALTER TABLE public.supporters ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT false;

-- 3. Migrate existing data: anyone with 'admin' role becomes supporter with admin permission
UPDATE public.supporters 
SET role = 'supporter'::user_role, is_admin = true 
WHERE role = 'admin'::user_role;

UPDATE public.supporters 
SET is_admin = true 
WHERE permission_level = 'admin'::permission_level;

-- 4. Update permission_level enum to remove 'admin'
CREATE TYPE public.permission_level_fixed AS ENUM ('viewer', 'collaborator');

-- 5. Migrate permission levels: 'admin' becomes 'collaborator' with is_admin=true
UPDATE public.supporters 
SET permission_level = 'collaborator'::permission_level 
WHERE permission_level = 'admin'::permission_level;

-- 6. Create audit log table for admin actions
CREATE TABLE public.admin_action_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  individual_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  target_user_id UUID,
  target_goal_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_action_log ENABLE ROW LEVEL SECURITY;

-- Admins can view logs for individuals they support
CREATE POLICY "Admins can view action logs for their individuals" 
ON public.admin_action_log FOR SELECT
USING (
  individual_id IN (
    SELECT individual_id FROM supporters 
    WHERE supporter_id = auth.uid() AND is_admin = true
  )
);

-- System can insert logs
CREATE POLICY "System can insert admin action logs"
ON public.admin_action_log FOR INSERT
WITH CHECK (admin_user_id = auth.uid());

-- 7. Add user consent table for "view as" functionality
CREATE TABLE public.user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  individual_id UUID NOT NULL,
  admin_id UUID NOT NULL,
  consent_type TEXT NOT NULL, -- 'view_as', 'edit_on_behalf', etc.
  granted BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(individual_id, admin_id, consent_type)
);

ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

-- Users can manage their own consents
CREATE POLICY "Users can manage their own consents"
ON public.user_consents FOR ALL
USING (individual_id = auth.uid());

-- Admins can view consents granted to them
CREATE POLICY "Admins can view consents granted to them"
ON public.user_consents FOR SELECT
USING (admin_id = auth.uid());

-- 8. Ensure at least one admin per individual constraint
CREATE OR REPLACE FUNCTION public.ensure_at_least_one_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this would leave the individual with no admins
  IF (TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND NEW.is_admin = false)) THEN
    IF NOT EXISTS (
      SELECT 1 FROM supporters 
      WHERE individual_id = COALESCE(OLD.individual_id, NEW.individual_id)
      AND is_admin = true 
      AND id != COALESCE(OLD.id, NEW.id)
    ) THEN
      RAISE EXCEPTION 'Cannot remove last admin for individual. At least one admin must remain.';
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_admin_exists
  BEFORE UPDATE OR DELETE ON supporters
  FOR EACH ROW
  EXECUTE FUNCTION ensure_at_least_one_admin();

-- 9. Update the permission check function with comprehensive actions
CREATE OR REPLACE FUNCTION public.check_user_permission_v2(
  _individual_id UUID,
  _action TEXT,
  _goal_id UUID DEFAULT NULL,
  _scope TEXT DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
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
  SELECT account_status INTO _account_status 
  FROM profiles WHERE user_id = _individual_id;
  
  -- Get supporter relationship
  SELECT role, permission_level, is_admin, is_provisioner
  INTO _user_role, _permission_level, _is_admin, _is_provisioner
  FROM supporters 
  WHERE individual_id = _individual_id AND supporter_id = _current_user_id;
  
  -- If no relationship found, deny access
  IF _user_role IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check consent for sensitive actions
  IF _action IN ('view_as_user', 'export_reports') THEN
    SELECT granted INTO _has_consent
    FROM user_consents 
    WHERE individual_id = _individual_id 
    AND admin_id = _current_user_id 
    AND consent_type = _action
    AND granted = true
    AND (expires_at IS NULL OR expires_at > now());
  END IF;
  
  -- Permission logic based on action
  CASE _action
    -- Goal management
    WHEN 'view_goals' THEN
      RETURN _permission_level IN ('viewer', 'collaborator') OR _is_admin OR
             (_user_role = 'friend' AND _goal_id = ANY(
               SELECT unnest(specific_goals) FROM supporters 
               WHERE individual_id = _individual_id AND supporter_id = _current_user_id
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
        SELECT granted INTO _has_consent
        FROM user_consents 
        WHERE individual_id = _individual_id 
        AND admin_id = _current_user_id 
        AND consent_type = 'provider_reflections'
        AND granted = true;
        RETURN _has_consent;
      ELSE
        RETURN _is_admin OR _permission_level = 'collaborator';
      END IF;
    
    ELSE
      RETURN false;
  END CASE;
END;
$$;