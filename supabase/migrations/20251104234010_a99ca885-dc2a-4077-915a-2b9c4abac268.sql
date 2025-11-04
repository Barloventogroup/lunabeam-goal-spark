-- First, drop the existing CHECK constraint
ALTER TABLE goals DROP CONSTRAINT IF EXISTS goals_goal_type_check;

-- Add new CHECK constraint that includes 'progressive_mastery'
ALTER TABLE goals ADD CONSTRAINT goals_goal_type_check 
CHECK (goal_type IS NULL OR goal_type IN ('habit', 'reminder', 'practice', 'new_skill', 'progressive_mastery'));

-- Now fix existing PM goals that have NULL goal_type but have PM metadata
UPDATE goals
SET goal_type = 'progressive_mastery'
WHERE goal_type IS NULL
AND (
  metadata->'wizardContext'->>'goalType' = 'progressive_mastery'
  OR metadata->'pmContext'->>'goalType' = 'progressive_mastery'
);

-- Reset stuck generation status for PM goals to allow retry
UPDATE goals
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{generationStatus}',
  '"queued"'::jsonb
)
WHERE goal_type = 'progressive_mastery'
AND (
  metadata->>'generationStatus' = 'pending'
  OR metadata->>'generationStatus' = 'failed'
)
AND NOT EXISTS (
  SELECT 1 FROM steps 
  WHERE steps.goal_id = goals.id 
  AND steps.is_planned = true
  LIMIT 6
);