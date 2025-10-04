-- Add is_supporter_step flag to steps table
ALTER TABLE steps 
ADD COLUMN is_supporter_step BOOLEAN NOT NULL DEFAULT false;

-- Create index for filtering supporter steps
CREATE INDEX idx_steps_is_supporter ON steps(goal_id, is_supporter_step);

-- Add comment for clarity
COMMENT ON COLUMN steps.is_supporter_step IS 'Indicates if this step is a support action for a parent/coach (true) or an individual action step (false)';