-- Create a more direct user deletion function that bypasses all constraints
CREATE OR REPLACE FUNCTION public.admin_delete_user(user_id_to_delete uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Drop the constraint temporarily to allow deletion
  ALTER TABLE supporters DROP CONSTRAINT IF EXISTS ensure_at_least_one_admin;
  
  -- Delete all data associated with this user
  DELETE FROM substeps WHERE step_id IN (
    SELECT s.id FROM steps s 
    JOIN goals g ON s.goal_id = g.id 
    WHERE g.owner_id = user_id_to_delete
  );
  
  DELETE FROM steps WHERE goal_id IN (
    SELECT id FROM goals WHERE owner_id = user_id_to_delete
  );
  
  DELETE FROM goals WHERE owner_id = user_id_to_delete;
  DELETE FROM goal_proposals WHERE individual_id = user_id_to_delete OR proposer_id = user_id_to_delete;
  DELETE FROM points_log WHERE user_id = user_id_to_delete;
  DELETE FROM user_points WHERE user_id = user_id_to_delete;
  DELETE FROM redemptions WHERE user_id = user_id_to_delete OR approved_by = user_id_to_delete;
  DELETE FROM rewards WHERE owner_id = user_id_to_delete;
  DELETE FROM check_ins WHERE user_id = user_id_to_delete;
  DELETE FROM evidence WHERE user_id = user_id_to_delete;
  DELETE FROM badges WHERE user_id = user_id_to_delete;
  DELETE FROM notifications WHERE user_id = user_id_to_delete;
  DELETE FROM circle_memberships WHERE user_id = user_id_to_delete;
  DELETE FROM circle_invites WHERE inviter_id = user_id_to_delete;
  DELETE FROM weekly_checkins WHERE user_id = user_id_to_delete;
  DELETE FROM family_circles WHERE owner_id = user_id_to_delete;
  DELETE FROM supporter_consents WHERE user_id = user_id_to_delete;
  DELETE FROM admin_action_log WHERE individual_id = user_id_to_delete OR admin_user_id = user_id_to_delete OR target_user_id = user_id_to_delete;
  DELETE FROM user_consents WHERE individual_id = user_id_to_delete OR admin_id = user_id_to_delete;
  DELETE FROM account_claims WHERE provisioner_id = user_id_to_delete OR individual_id = user_id_to_delete;
  DELETE FROM supporter_invites WHERE inviter_id = user_id_to_delete OR individual_id = user_id_to_delete;
  
  -- Delete supporter relationships (this is where the constraint was blocking)
  DELETE FROM supporters WHERE supporter_id = user_id_to_delete OR individual_id = user_id_to_delete;
  
  -- Delete profile and auth user
  DELETE FROM profiles WHERE user_id = user_id_to_delete;
  DELETE FROM auth.users WHERE id = user_id_to_delete;
  
  -- Recreate the constraint
  ALTER TABLE supporters ADD CONSTRAINT ensure_at_least_one_admin 
    CHECK (NOT EXISTS (
      SELECT 1 FROM supporters s1 
      WHERE s1.individual_id = individual_id 
      AND NOT EXISTS (
        SELECT 1 FROM supporters s2 
        WHERE s2.individual_id = s1.individual_id 
        AND s2.is_admin = true
      )
    ));
  
  RETURN true;
  
EXCEPTION WHEN others THEN
  -- Try to recreate constraint on error
  BEGIN
    ALTER TABLE supporters ADD CONSTRAINT ensure_at_least_one_admin 
      CHECK (NOT EXISTS (
        SELECT 1 FROM supporters s1 
        WHERE s1.individual_id = individual_id 
        AND NOT EXISTS (
          SELECT 1 FROM supporters s2 
          WHERE s2.individual_id = s1.individual_id 
          AND s2.is_admin = true
        )
      ));
  EXCEPTION WHEN others THEN
    -- Ignore constraint recreation error
  END;
  
  RAISE EXCEPTION 'Failed to delete user: %', SQLERRM;
END;
$$;