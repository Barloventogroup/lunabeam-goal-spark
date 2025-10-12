-- Add habit tracking fields to goals table
ALTER TABLE goals 
  ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_completed_date DATE,
  ADD COLUMN IF NOT EXISTS goal_type VARCHAR(20) CHECK (goal_type IN ('reminder', 'practice', 'new_skill')),
  ADD COLUMN IF NOT EXISTS selected_days TEXT[] DEFAULT '{}';

-- Add habit tracking fields to steps table  
ALTER TABLE steps 
  ADD COLUMN IF NOT EXISTS completion_streak INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS skip_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS skip_reasons JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS last_skipped_date DATE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_goals_goal_type ON goals(goal_type);
CREATE INDEX IF NOT EXISTS idx_goals_last_completed ON goals(last_completed_date);
CREATE INDEX IF NOT EXISTS idx_steps_initiated_at ON steps(initiated_at);

-- Backfill existing goals (set to 'practice' for active goals)
UPDATE goals 
SET goal_type = 'practice' 
WHERE status = 'active' AND goal_type IS NULL;