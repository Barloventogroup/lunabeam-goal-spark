-- Create RPC for efficient points calculation
CREATE OR REPLACE FUNCTION get_user_total_points(p_user_id uuid)
RETURNS integer AS $$
  SELECT COALESCE(SUM(total_points), 0)::integer
  FROM user_points
  WHERE user_id = p_user_id;
$$ LANGUAGE sql STABLE;

-- Create optimized view for supporter redemptions
CREATE OR REPLACE VIEW supporter_redemptions_summary AS
SELECT 
  r.id,
  r.user_id,
  r.reward_id,
  r.status,
  r.requested_at,
  r.approved_at,
  r.approved_by,
  r.fulfilled_at,
  r.notes,
  rw.name as reward_name,
  rw.point_cost as reward_point_cost,
  rw.category as reward_category,
  rw.image as reward_image,
  rw.owner_id as reward_owner_id
FROM redemptions r
JOIN rewards rw ON r.reward_id = rw.id;

-- Grant access to the view
GRANT SELECT ON supporter_redemptions_summary TO authenticated;

-- Add index for better redemption query performance
CREATE INDEX IF NOT EXISTS idx_redemptions_status_requested_at 
ON redemptions(status, requested_at DESC);

CREATE INDEX IF NOT EXISTS idx_redemptions_user_id_status 
ON redemptions(user_id, status);

-- Add index for rewards query performance
CREATE INDEX IF NOT EXISTS idx_rewards_owner_active 
ON rewards(owner_id, is_active);
