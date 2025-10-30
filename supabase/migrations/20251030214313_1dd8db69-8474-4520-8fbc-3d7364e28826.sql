-- Add RLS policies for supporter_accessible_goals view

-- Enable RLS on the view (though views inherit from underlying tables)
-- Add policy to ensure users can only see goals they have access to
CREATE POLICY "Users can view their own goals via view"
ON goals FOR SELECT
USING (
  owner_id = auth.uid()
  OR
  created_by = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM supporters s
    WHERE s.individual_id = goals.owner_id
    AND s.supporter_id = auth.uid()
  )
);