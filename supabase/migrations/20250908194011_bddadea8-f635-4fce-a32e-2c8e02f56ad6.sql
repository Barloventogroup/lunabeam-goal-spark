-- Fix the points not updating issue by ensuring the trigger is properly set up
-- First, let's recreate the trigger to make sure it's working

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS award_points_on_step_completion_v2 ON public.steps;

-- Recreate the trigger with proper configuration
CREATE TRIGGER award_points_on_step_completion_v2
  AFTER UPDATE ON public.steps
  FOR EACH ROW
  EXECUTE FUNCTION public.award_step_points_v2();

-- Also check if we need to manually award points to the recent steps that missed points
-- First, let's award points to the steps that were completed but didn't get points

-- Update the step that should have gotten 5 points for school/habit type
UPDATE public.steps 
SET points_awarded = 5
WHERE id = '52ef9513-58b2-4317-84ee-de66b498910d'
  AND points_awarded = 0
  AND status = 'done';

UPDATE public.steps 
SET points_awarded = 5  
WHERE id = '8817e68b-b93d-4be2-b851-ef4d9a2c782a'
  AND points_awarded = 0
  AND status = 'done';

-- Manually update the user_points table for the missing points
-- Each step should add 5 points to the 'school' category
INSERT INTO public.user_points (user_id, category, total_points, updated_at)
SELECT 
  g.owner_id,
  'school',
  10, -- 5 points for each of the 2 steps
  now()
FROM steps s
JOIN goals g ON s.goal_id = g.id
WHERE s.id IN ('52ef9513-58b2-4317-84ee-de66b498910d', '8817e68b-b93d-4be2-b851-ef4d9a2c782a')
LIMIT 1
ON CONFLICT (user_id, category)
DO UPDATE SET 
  total_points = public.user_points.total_points + EXCLUDED.total_points,
  updated_at = now();

-- Update the goal earned_points
UPDATE public.goals 
SET earned_points = earned_points + 5,
    updated_at = now()
WHERE id IN (
  SELECT DISTINCT goal_id 
  FROM steps 
  WHERE id IN ('52ef9513-58b2-4317-84ee-de66b498910d', '8817e68b-b93d-4be2-b851-ef4d9a2c782a')
);

-- Log the point awards in points_log
INSERT INTO public.points_log (
  user_id, 
  goal_id, 
  step_id, 
  category, 
  step_type, 
  points_awarded
)
SELECT 
  g.owner_id,
  s.goal_id,
  s.id,
  'school',
  s.step_type,
  5
FROM steps s
JOIN goals g ON s.goal_id = g.id
WHERE s.id IN ('52ef9513-58b2-4317-84ee-de66b498910d', '8817e68b-b93d-4be2-b851-ef4d9a2c782a');