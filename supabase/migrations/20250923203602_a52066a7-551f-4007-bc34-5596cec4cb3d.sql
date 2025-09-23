-- Update admin_delete_user to bypass the last admin constraint
CREATE OR REPLACE FUNCTION public.admin_delete_user(user_id_to_delete uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Delete in correct order to avoid foreign key violations
  
  -- First, remove the constraint temporarily by updating other supporters to admin
  -- if this user is the last admin, promote another supporter to admin
  UPDATE supporters 
  SET is_admin = true 
  WHERE individual_id IN (
    SELECT DISTINCT s1.individual_id 
    FROM supporters s1 
    WHERE s1.supporter_id = user_id_to_delete 
    AND s1.is_admin = true
    AND NOT EXISTS (
      SELECT 1 FROM supporters s2 
      WHERE s2.individual_id = s1.individual_id 
      AND s2.is_admin = true 
      AND s2.supporter_id != user_id_to_delete
    )
  )
  AND supporter_id != user_id_to_delete
  AND id = (
    SELECT MIN(id) FROM supporters s3 
    WHERE s3.individual_id = supporters.individual_id 
    AND s3.supporter_id != user_id_to_delete
  );
  
  -- Delete supporter relationships where user is supporter
  DELETE FROM supporters WHERE supporter_id = user_id_to_delete;
  
  -- Delete supporter relationships where user is individual
  DELETE FROM supporters WHERE individual_id = user_id_to_delete;
  
  -- Delete supporter invites
  DELETE FROM supporter_invites WHERE inviter_id = user_id_to_delete;
  DELETE FROM supporter_invites WHERE individual_id = user_id_to_delete;
  
  -- Delete account claims
  DELETE FROM account_claims WHERE provisioner_id = user_id_to_delete;
  DELETE FROM account_claims WHERE individual_id = user_id_to_delete;
  
  -- Delete user consents
  DELETE FROM user_consents WHERE individual_id = user_id_to_delete;
  DELETE FROM user_consents WHERE admin_id = user_id_to_delete;
  
  -- Delete goals and related data
  DELETE FROM substeps WHERE step_id IN (
    SELECT s.id FROM steps s 
    JOIN goals g ON s.goal_id = g.id 
    WHERE g.owner_id = user_id_to_delete
  );
  
  DELETE FROM steps WHERE goal_id IN (
    SELECT id FROM goals WHERE owner_id = user_id_to_delete
  );
  
  DELETE FROM goals WHERE owner_id = user_id_to_delete;
  
  -- Delete goal proposals
  DELETE FROM goal_proposals WHERE individual_id = user_id_to_delete;
  DELETE FROM goal_proposals WHERE proposer_id = user_id_to_delete;
  
  -- Delete points and logs
  DELETE FROM points_log WHERE user_id = user_id_to_delete;
  DELETE FROM user_points WHERE user_id = user_id_to_delete;
  
  -- Delete rewards and redemptions
  DELETE FROM redemptions WHERE user_id = user_id_to_delete;
  DELETE FROM redemptions WHERE approved_by = user_id_to_delete;
  DELETE FROM rewards WHERE owner_id = user_id_to_delete;
  
  -- Delete other user data
  DELETE FROM check_ins WHERE user_id = user_id_to_delete;
  DELETE FROM evidence WHERE user_id = user_id_to_delete;
  DELETE FROM badges WHERE user_id = user_id_to_delete;
  DELETE FROM notifications WHERE user_id = user_id_to_delete;
  
  -- Delete family circles and memberships
  DELETE FROM circle_memberships WHERE user_id = user_id_to_delete;
  DELETE FROM circle_invites WHERE inviter_id = user_id_to_delete;
  DELETE FROM weekly_checkins WHERE user_id = user_id_to_delete;
  DELETE FROM family_circles WHERE owner_id = user_id_to_delete;
  
  -- Delete supporter consents
  DELETE FROM supporter_consents WHERE user_id = user_id_to_delete;
  
  -- Delete admin action logs
  DELETE FROM admin_action_log WHERE individual_id = user_id_to_delete;
  DELETE FROM admin_action_log WHERE admin_user_id = user_id_to_delete;
  DELETE FROM admin_action_log WHERE target_user_id = user_id_to_delete;
  
  -- Finally delete the profile (this should cascade to auth.users if properly configured)
  DELETE FROM profiles WHERE user_id = user_id_to_delete;
  
  -- Delete from auth.users (if profile deletion didn't cascade)
  DELETE FROM auth.users WHERE id = user_id_to_delete;
  
  RETURN true;
  
EXCEPTION WHEN others THEN
  RAISE EXCEPTION 'Failed to delete user: %', SQLERRM;
END;
$$;