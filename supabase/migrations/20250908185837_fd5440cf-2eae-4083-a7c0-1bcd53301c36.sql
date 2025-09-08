-- Update goals table to support the new points system
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS frequency_per_week integer;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS duration_weeks integer;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS planned_steps_count integer DEFAULT 0;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS planned_milestones_count integer DEFAULT 0;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS planned_scaffold_count integer DEFAULT 0;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS base_points_per_planned_step integer DEFAULT 5;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS base_points_per_milestone integer DEFAULT 0;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS substep_points integer DEFAULT 2;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS goal_completion_bonus integer DEFAULT 10;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS total_possible_points integer DEFAULT 0;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS earned_points integer DEFAULT 0;

-- Update steps table to support step types and planning
ALTER TABLE public.steps ADD COLUMN IF NOT EXISTS step_type text DEFAULT 'habit';
ALTER TABLE public.steps ADD COLUMN IF NOT EXISTS is_planned boolean DEFAULT true;
ALTER TABLE public.steps ADD COLUMN IF NOT EXISTS planned_week_index integer;
ALTER TABLE public.steps ADD COLUMN IF NOT EXISTS points_awarded integer DEFAULT 0;

-- Create substeps table
CREATE TABLE IF NOT EXISTS public.substeps (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  step_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  is_planned boolean DEFAULT false,
  completed_at timestamp with time zone,
  points_awarded integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on substeps
ALTER TABLE public.substeps ENABLE ROW LEVEL SECURITY;

-- Create policies for substeps
CREATE POLICY "Users can view substeps for their goals" 
ON public.substeps 
FOR SELECT 
USING (step_id IN (
  SELECT s.id FROM steps s 
  JOIN goals g ON s.goal_id = g.id 
  WHERE g.owner_id = auth.uid()
));

CREATE POLICY "Users can create substeps for their goals" 
ON public.substeps 
FOR INSERT 
WITH CHECK (step_id IN (
  SELECT s.id FROM steps s 
  JOIN goals g ON s.goal_id = g.id 
  WHERE g.owner_id = auth.uid()
));

CREATE POLICY "Users can update substeps for their goals" 
ON public.substeps 
FOR UPDATE 
USING (step_id IN (
  SELECT s.id FROM steps s 
  JOIN goals g ON s.goal_id = g.id 
  WHERE g.owner_id = auth.uid()
));

CREATE POLICY "Users can delete substeps for their goals" 
ON public.substeps 
FOR DELETE 
USING (step_id IN (
  SELECT s.id FROM steps s 
  JOIN goals g ON s.goal_id = g.id 
  WHERE g.owner_id = auth.uid()
));

-- Create points_log table for tracking all point awards
CREATE TABLE IF NOT EXISTS public.points_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  goal_id uuid NOT NULL,
  step_id uuid,
  substep_id uuid,
  category text NOT NULL,
  step_type text NOT NULL,
  points_awarded integer NOT NULL,
  awarded_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on points_log
ALTER TABLE public.points_log ENABLE ROW LEVEL SECURITY;

-- Create policies for points_log
CREATE POLICY "Users can view their own points log" 
ON public.points_log 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "System can insert points log entries" 
ON public.points_log 
FOR INSERT 
WITH CHECK (true);

-- Add trigger for substeps updated_at
CREATE TRIGGER update_substeps_updated_at
BEFORE UPDATE ON public.substeps
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update calculate_step_points function with new category-specific logic
CREATE OR REPLACE FUNCTION public.calculate_step_points_v2(
  category text, 
  step_type text DEFAULT 'habit',
  step_title text DEFAULT '',
  step_notes text DEFAULT ''
)
RETURNS integer
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  pts integer := 5;
  combined_text text;
BEGIN
  combined_text := lower(step_title || ' ' || COALESCE(step_notes, ''));
  
  CASE category
    WHEN 'education' THEN
      CASE step_type
        WHEN 'habit', 'action' THEN pts := 5;
        WHEN 'milestone' THEN pts := 20;
        WHEN 'scaffolding' THEN pts := 2;
        ELSE pts := 5;
      END CASE;
      
    WHEN 'independent_living' THEN
      CASE step_type
        WHEN 'habit', 'self_check' THEN pts := 5;
        WHEN 'practice', 'skill', 'safety', 'money' THEN pts := 10;
        WHEN 'milestone', 'independent' THEN pts := 20;
        WHEN 'scaffolding' THEN pts := 2;
        ELSE pts := 5;
      END CASE;
      
    WHEN 'postsecondary' THEN
      CASE step_type
        WHEN 'exploration' THEN pts := 5;
        WHEN 'preparation' THEN pts := 15;
        WHEN 'milestone', 'high_stakes' THEN pts := 25;
        WHEN 'scaffolding' THEN pts := 2;
        ELSE pts := 5;
      END CASE;
      
    WHEN 'recreation_fun' THEN
      CASE step_type
        WHEN 'solo' THEN pts := 5;
        WHEN 'group' THEN pts := 10;
        WHEN 'milestone', 'leadership', 'streak' THEN pts := 20;
        WHEN 'scaffolding' THEN pts := 2;
        ELSE pts := 5;
      END CASE;
      
    WHEN 'social_skills' THEN
      CASE step_type
        WHEN 'basic' THEN pts := 5;
        WHEN 'applied' THEN pts := 15;
        WHEN 'milestone', 'leadership', 'advanced' THEN pts := 25;
        WHEN 'scaffolding' THEN pts := 2;
        ELSE pts := 5;
      END CASE;
      
    WHEN 'employment' THEN
      CASE step_type
        WHEN 'exploration', 'prep' THEN pts := 5;
        WHEN 'experience' THEN pts := 15;
        WHEN 'milestone', 'high_stakes' THEN pts := 30;
        WHEN 'scaffolding' THEN pts := 2;
        ELSE pts := 5;
      END CASE;
      
    WHEN 'self_advocacy' THEN
      CASE step_type
        WHEN 'basic' THEN pts := 5;
        WHEN 'applied' THEN pts := 15;
        WHEN 'milestone', 'leadership' THEN pts := 30;
        WHEN 'scaffolding' THEN pts := 2;
        ELSE pts := 5;
      END CASE;
      
    WHEN 'health' THEN
      CASE step_type
        WHEN 'habit', 'log' THEN pts := 5;
        WHEN 'supported' THEN pts := 10;
        WHEN 'milestone', 'streak' THEN pts := 20;
        WHEN 'scaffolding' THEN pts := 2;
        ELSE pts := 5;
      END CASE;
      
    ELSE
      pts := 5;
  END CASE;

  RETURN pts;
END;
$$;

-- Function to get goal completion bonus by category
CREATE OR REPLACE FUNCTION public.get_goal_completion_bonus(category text)
RETURNS integer
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN CASE category
    WHEN 'education' THEN 10
    WHEN 'independent_living' THEN 15
    WHEN 'postsecondary' THEN 20
    WHEN 'recreation_fun' THEN 10
    WHEN 'social_skills' THEN 20
    WHEN 'employment' THEN 25
    WHEN 'self_advocacy' THEN 20
    WHEN 'health' THEN 15
    ELSE 10
  END;
END;
$$;

-- Function to calculate Total Possible Points (TPP) for a goal
CREATE OR REPLACE FUNCTION public.calculate_total_possible_points(
  p_category text,
  p_frequency_per_week integer,
  p_duration_weeks integer,
  p_planned_milestones_count integer DEFAULT 0,
  p_planned_scaffold_count integer DEFAULT 0,
  p_step_type text DEFAULT 'habit'
)
RETURNS integer
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  planned_steps integer;
  base_step_points integer;
  milestone_points integer;
  substep_points integer := 2;
  goal_bonus integer;
  tpp integer;
BEGIN
  -- Calculate planned steps
  planned_steps := p_frequency_per_week * p_duration_weeks;
  
  -- Get base points for planned step type
  base_step_points := public.calculate_step_points_v2(p_category, p_step_type);
  
  -- Get milestone points (use milestone type)
  milestone_points := public.calculate_step_points_v2(p_category, 'milestone');
  
  -- Get goal completion bonus
  goal_bonus := public.get_goal_completion_bonus(p_category);
  
  -- Calculate TPP
  tpp := (planned_steps * base_step_points) +
         (p_planned_milestones_count * milestone_points) +
         (p_planned_scaffold_count * substep_points) +
         goal_bonus;
  
  RETURN tpp;
END;
$$;

-- Updated trigger function for awarding points with new system
CREATE OR REPLACE FUNCTION public.award_step_points_v2()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO public
AS $$
DECLARE
  pts integer := 0;
  uid uuid;
  goal_category text;
  goal_completion_bonus integer := 0;
  all_planned_complete boolean := false;
  already_awarded_completion boolean := false;
BEGIN
  BEGIN
    IF TG_OP = 'UPDATE' AND NEW.status = 'done' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
      
      -- Get goal info
      SELECT g.owner_id, g.domain, g.goal_completion_bonus 
      INTO uid, goal_category, goal_completion_bonus
      FROM public.goals g WHERE g.id = NEW.goal_id;
      
      IF uid IS NULL THEN
        RETURN NEW;
      END IF;

      -- Calculate points for this step
      pts := public.calculate_step_points_v2(
        COALESCE(goal_category, 'general'),
        COALESCE(NEW.step_type, 'habit'),
        NEW.title,
        COALESCE(NEW.notes, '')
      );

      -- Update step with points awarded
      NEW.points_awarded := pts;

      -- Award points to user_points table
      INSERT INTO public.user_points (user_id, category, total_points, updated_at)
      VALUES (uid, COALESCE(goal_category, 'general'), pts, now())
      ON CONFLICT (user_id, category)
      DO UPDATE SET 
        total_points = public.user_points.total_points + EXCLUDED.total_points,
        updated_at = now();

      -- Update goal earned_points
      UPDATE public.goals SET 
        earned_points = earned_points + pts,
        updated_at = now()
      WHERE id = NEW.goal_id;

      -- Log the point award
      INSERT INTO public.points_log (
        user_id, goal_id, step_id, category, step_type, points_awarded
      ) VALUES (
        uid, NEW.goal_id, NEW.id, COALESCE(goal_category, 'general'), 
        COALESCE(NEW.step_type, 'habit'), pts
      );

      -- Check if all planned steps are complete for goal completion bonus
      SELECT NOT EXISTS(
        SELECT 1 FROM public.steps s 
        WHERE s.goal_id = NEW.goal_id 
        AND s.is_planned = true 
        AND s.status != 'done'
      ) INTO all_planned_complete;

      -- Check if completion bonus already awarded
      SELECT EXISTS(
        SELECT 1 FROM public.points_log pl
        WHERE pl.goal_id = NEW.goal_id 
        AND pl.step_type = 'goal_completion'
      ) INTO already_awarded_completion;

      -- Award goal completion bonus if applicable
      IF all_planned_complete AND NOT already_awarded_completion THEN
        -- Award completion bonus
        INSERT INTO public.user_points (user_id, category, total_points, updated_at)
        VALUES (uid, COALESCE(goal_category, 'general'), goal_completion_bonus, now())
        ON CONFLICT (user_id, category)
        DO UPDATE SET 
          total_points = public.user_points.total_points + EXCLUDED.total_points,
          updated_at = now();

        -- Update goal earned_points
        UPDATE public.goals SET 
          earned_points = earned_points + goal_completion_bonus,
          updated_at = now()
        WHERE id = NEW.goal_id;

        -- Log completion bonus
        INSERT INTO public.points_log (
          user_id, goal_id, category, step_type, points_awarded
        ) VALUES (
          uid, NEW.goal_id, COALESCE(goal_category, 'general'), 
          'goal_completion', goal_completion_bonus
        );
      END IF;
      
    END IF;
    
    RETURN NEW;
  EXCEPTION WHEN others THEN
    RETURN NEW;
  END;
END;
$$;

-- Replace the old trigger with the new one
DROP TRIGGER IF EXISTS award_points_on_step_completion ON public.steps;
CREATE TRIGGER award_points_on_step_completion_v2
AFTER UPDATE ON public.steps
FOR EACH ROW
EXECUTE FUNCTION public.award_step_points_v2();