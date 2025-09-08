-- Allow points logged without a specific goal (e.g., reward redemptions)
ALTER TABLE public.points_log 
ALTER COLUMN goal_id DROP NOT NULL;