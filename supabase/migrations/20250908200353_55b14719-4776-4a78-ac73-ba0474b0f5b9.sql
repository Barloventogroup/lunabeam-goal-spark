-- Create trigger function to award points when substeps are completed
CREATE OR REPLACE FUNCTION public.award_substep_points()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  pts integer := 2; -- Substeps are always worth 2 points
  uid uuid;
  goal_category text;
BEGIN
  -- Only award points when substep is marked as completed
  IF TG_OP = 'UPDATE' AND NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL THEN
    
    -- Get user and category info from the related step and goal
    SELECT g.owner_id, g.domain 
    INTO uid, goal_category
    FROM public.goals g 
    JOIN public.steps s ON s.goal_id = g.id
    WHERE s.id = NEW.step_id;
    
    IF uid IS NULL THEN
      RETURN NEW;
    END IF;

    -- Map domain to category for points tracking
    goal_category := CASE COALESCE(goal_category, '')
      WHEN 'independent-living' THEN 'independent_living'
      WHEN 'education' THEN 'education'
      WHEN 'postsecondary' THEN 'postsecondary'
      WHEN 'recreation' THEN 'recreation_fun'
      WHEN 'social' THEN 'social_skills'
      WHEN 'employment' THEN 'employment'
      WHEN 'self-advocacy' THEN 'self_advocacy'
      WHEN 'health' THEN 'health'
      WHEN 'school' THEN 'education'
      ELSE 'general'
    END;

    -- Award points to user_points table
    INSERT INTO public.user_points (user_id, category, total_points, updated_at)
    VALUES (uid, goal_category, pts, now())
    ON CONFLICT (user_id, category)
    DO UPDATE SET 
      total_points = public.user_points.total_points + EXCLUDED.total_points,
      updated_at = now();

    -- Update goal earned_points
    UPDATE public.goals SET 
      earned_points = earned_points + pts,
      updated_at = now()
    WHERE id = (SELECT goal_id FROM public.steps WHERE id = NEW.step_id);

    -- Log the point award
    INSERT INTO public.points_log (
      user_id, goal_id, substep_id, category, step_type, points_awarded
    ) VALUES (
      uid, 
      (SELECT goal_id FROM public.steps WHERE id = NEW.step_id),
      NEW.id, 
      goal_category, 
      'scaffolding', 
      pts
    );
    
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger on substeps table
DROP TRIGGER IF EXISTS substep_points_trigger ON public.substeps;
CREATE TRIGGER substep_points_trigger
  AFTER UPDATE ON public.substeps
  FOR EACH ROW
  EXECUTE FUNCTION public.award_substep_points();