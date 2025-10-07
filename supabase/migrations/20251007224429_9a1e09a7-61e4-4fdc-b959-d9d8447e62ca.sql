-- 1) Patch trigger function to allow full account deletion flows
CREATE OR REPLACE FUNCTION public.ensure_at_least_one_admin()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Skip guard if the associated individual's profile no longer exists
  -- (indicates the account is being deleted in a controlled flow)
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = COALESCE(OLD.individual_id, NEW.individual_id)
  ) THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Check if this change would leave the individual with no admins
  IF (TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND NEW.is_admin = false)) THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.supporters s
      WHERE s.individual_id = COALESCE(OLD.individual_id, NEW.individual_id)
        AND s.is_admin = true
        AND s.id != COALESCE(OLD.id, NEW.id)
    ) THEN
      RAISE EXCEPTION 'Cannot remove last admin for individual. At least one admin must remain.';
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- 2) Reorder admin_delete_user to delete profile first and then supporters
CREATE OR REPLACE FUNCTION public.admin_delete_user(user_id_to_delete uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _triggers_disabled boolean := false;
BEGIN
  -- Delete the profile first so the supporters last-admin guard bypasses for this individual
  BEGIN
    DELETE FROM public.profiles WHERE user_id = user_id_to_delete;
  EXCEPTION WHEN others THEN
    -- ignore if already deleted
    NULL;
  END;

  -- Try to disable supporters triggers during cascading cleanup
  BEGIN
    EXECUTE 'ALTER TABLE public.supporters DISABLE TRIGGER ALL';
    _triggers_disabled := true;
  EXCEPTION WHEN others THEN
    _triggers_disabled := false; -- proceed with fallback below
  END;

  -- Fallback: if triggers not disabled, promote another supporter to admin
  -- for individuals where this user is the sole admin (other people's accounts)
  IF NOT _triggers_disabled THEN
    UPDATE public.supporters s
    SET is_admin = true
    WHERE s.individual_id IN (
      SELECT DISTINCT s1.individual_id 
      FROM public.supporters s1 
      WHERE s1.supporter_id = user_id_to_delete 
        AND s1.is_admin = true
        AND NOT EXISTS (
          SELECT 1 FROM public.supporters s2 
          WHERE s2.individual_id = s1.individual_id 
            AND s2.is_admin = true 
            AND s2.supporter_id != user_id_to_delete
        )
    )
    AND s.supporter_id != user_id_to_delete
    AND s.id = (
      SELECT s3.id FROM public.supporters s3 
      WHERE s3.individual_id = s.individual_id 
        AND s3.supporter_id != user_id_to_delete
      ORDER BY s3.created_at ASC, s3.id ASC
      LIMIT 1
    );
  END IF;

  -- Delete supporter relationships where user is supporter or individual
  DELETE FROM public.supporters WHERE supporter_id = user_id_to_delete;
  DELETE FROM public.supporters WHERE individual_id = user_id_to_delete;
  
  -- Delete supporter invites
  DELETE FROM public.supporter_invites WHERE inviter_id = user_id_to_delete;
  DELETE FROM public.supporter_invites WHERE individual_id = user_id_to_delete;
  
  -- Delete account claims
  DELETE FROM public.account_claims WHERE provisioner_id = user_id_to_delete;
  DELETE FROM public.account_claims WHERE individual_id = user_id_to_delete;
  
  -- Delete user consents
  DELETE FROM public.user_consents WHERE individual_id = user_id_to_delete;
  DELETE FROM public.user_consents WHERE admin_id = user_id_to_delete;
  
  -- Delete goals and related data
  DELETE FROM public.substeps WHERE step_id IN (
    SELECT s.id FROM public.steps s 
    JOIN public.goals g ON s.goal_id = g.id 
    WHERE g.owner_id = user_id_to_delete
  );
  
  DELETE FROM public.steps WHERE goal_id IN (
    SELECT id FROM public.goals WHERE owner_id = user_id_to_delete
  );
  
  DELETE FROM public.goals WHERE owner_id = user_id_to_delete;
  
  -- Delete goal proposals
  DELETE FROM public.goal_proposals WHERE individual_id = user_id_to_delete;
  DELETE FROM public.goal_proposals WHERE proposer_id = user_id_to_delete;
  
  -- Delete points and logs
  DELETE FROM public.points_log WHERE user_id = user_id_to_delete;
  DELETE FROM public.user_points WHERE user_id = user_id_to_delete;
  
  -- Delete rewards and redemptions
  DELETE FROM public.redemptions WHERE user_id = user_id_to_delete;
  DELETE FROM public.redemptions WHERE approved_by = user_id_to_delete;
  DELETE FROM public.rewards WHERE owner_id = user_id_to_delete;
  
  -- Delete other user data
  DELETE FROM public.check_ins WHERE user_id = user_id_to_delete;
  DELETE FROM public.evidence WHERE user_id = user_id_to_delete;
  DELETE FROM public.badges WHERE user_id = user_id_to_delete;
  DELETE FROM public.notifications WHERE user_id = user_id_to_delete;
  
  -- Delete family circles and memberships
  DELETE FROM public.circle_memberships WHERE user_id = user_id_to_delete;
  DELETE FROM public.circle_invites WHERE inviter_id = user_id_to_delete;
  DELETE FROM public.weekly_checkins WHERE user_id = user_id_to_delete;
  DELETE FROM public.family_circles WHERE owner_id = user_id_to_delete;
  
  -- Delete supporter consents
  DELETE FROM public.supporter_consents WHERE user_id = user_id_to_delete;
  
  -- Delete admin action logs
  DELETE FROM public.admin_action_log WHERE individual_id = user_id_to_delete;
  DELETE FROM public.admin_action_log WHERE admin_user_id = user_id_to_delete;
  DELETE FROM public.admin_action_log WHERE target_user_id = user_id_to_delete;
  
  -- Best-effort: remove from auth.users as last step
  DELETE FROM auth.users WHERE id = user_id_to_delete;

  -- Re-enable supporters triggers if we disabled them
  IF _triggers_disabled THEN
    BEGIN
      EXECUTE 'ALTER TABLE public.supporters ENABLE TRIGGER ALL';
    EXCEPTION WHEN others THEN
      NULL; -- ignore if we can't re-enable here
    END;
  END IF;

  RETURN true;
  
EXCEPTION WHEN others THEN
  -- Ensure triggers are re-enabled even on error
  IF _triggers_disabled THEN
    BEGIN
      EXECUTE 'ALTER TABLE public.supporters ENABLE TRIGGER ALL';
    EXCEPTION WHEN others THEN
      NULL;
    END;
  END IF;
  RAISE EXCEPTION 'Failed to delete user: %', SQLERRM;
END;
$function$;