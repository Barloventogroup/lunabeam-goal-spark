-- Store the function definition first
DO $$
DECLARE
    function_def TEXT;
BEGIN
    SELECT pg_get_functiondef(oid) INTO function_def
    FROM pg_proc 
    WHERE proname = 'ensure_at_least_one_admin' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
    
    -- Create a temporary table to store the function definition
    CREATE TEMP TABLE IF NOT EXISTS temp_function_backup AS 
    SELECT function_def as definition;
END $$;

-- Drop all related triggers and the function
DROP TRIGGER IF EXISTS ensure_at_least_one_admin_trigger ON public.supporters;
DROP FUNCTION IF EXISTS public.ensure_at_least_one_admin() CASCADE;

-- Clean up all user data and auth records
DELETE FROM public.weekly_checkins;
DELETE FROM public.user_points;
DELETE FROM public.user_consents;
DELETE FROM public.supporter_consents;
DELETE FROM public.supporters;
DELETE FROM public.supporter_invites;
DELETE FROM public.substeps;
DELETE FROM public.steps;
DELETE FROM public.rewards;
DELETE FROM public.redemptions;
DELETE FROM public.points_log;
DELETE FROM public.notifications;
DELETE FROM public.goals;
DELETE FROM public.goal_proposals;
DELETE FROM public.family_circles;
DELETE FROM public.evidence;
DELETE FROM public.circle_memberships;
DELETE FROM public.circle_invites;
DELETE FROM public.claim_attempt_log;
DELETE FROM public.check_ins;
DELETE FROM public.badges;
DELETE FROM public.admin_action_log;
DELETE FROM public.account_claims;
DELETE FROM public.profiles;

-- Delete all auth users
DELETE FROM auth.users;

-- Recreate the function and trigger
CREATE OR REPLACE FUNCTION public.ensure_at_least_one_admin()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$;

-- Recreate the trigger
CREATE TRIGGER ensure_at_least_one_admin_trigger
  BEFORE UPDATE OR DELETE ON public.supporters
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_at_least_one_admin();