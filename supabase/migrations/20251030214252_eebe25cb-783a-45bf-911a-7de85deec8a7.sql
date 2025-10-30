-- Phase 1: Performance Optimization Indexes and Views

-- Create optimized indexes for supporter goal access
CREATE INDEX IF NOT EXISTS idx_goals_supporter_access 
ON goals(owner_id, created_by, status);

CREATE INDEX IF NOT EXISTS idx_goals_owner_created 
ON goals(owner_id) 
INCLUDE (created_by, status, domain);

CREATE INDEX IF NOT EXISTS idx_supporters_lookup 
ON supporters(supporter_id, individual_id);

CREATE INDEX IF NOT EXISTS idx_goals_status_owner 
ON goals(status, owner_id);

-- Create a view for supporter-accessible goals
-- This pre-joins goals with supporter relationships for efficient querying
CREATE OR REPLACE VIEW supporter_accessible_goals AS
SELECT 
  g.*,
  s.supporter_id,
  s.role as supporter_role,
  s.permission_level,
  s.is_admin
FROM goals g
LEFT JOIN supporters s ON g.owner_id = s.individual_id;

-- Add index for user_points queries
CREATE INDEX IF NOT EXISTS idx_user_points_lookup 
ON user_points(user_id, category);

-- Add index for profiles queries
CREATE INDEX IF NOT EXISTS idx_profiles_user_id 
ON profiles(user_id) 
INCLUDE (first_name, avatar_url, account_status);