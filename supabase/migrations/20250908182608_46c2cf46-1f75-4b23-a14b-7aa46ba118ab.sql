-- Fix the award_step_points function to include category and correct conflict handling
CREATE OR REPLACE FUNCTION public.award_step_points()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  pts integer := 0;
  uid uuid;
BEGIN
  -- This function must NEVER cause a step update to fail
  BEGIN
    IF TG_OP = 'UPDATE' AND NEW.status = 'done' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
      
      -- Get owner safely
      SELECT owner_id INTO uid FROM public.goals WHERE id = NEW.goal_id;
      
      IF uid IS NULL THEN
        RAISE NOTICE 'No owner found for goal %', NEW.goal_id;
        RETURN NEW;
      END IF;

      -- Calculate points with safe fallback
      pts := COALESCE(
        public.calculate_step_points(
          NEW.title,
          COALESCE(NEW.notes, ''),
          COALESCE((SELECT domain::text FROM public.goals WHERE id = NEW.goal_id), '')
        ),
        5
      );

      -- Try to award points, but never let it block the step completion
      BEGIN
        INSERT INTO public.user_points (user_id, category, total_points, updated_at)
        VALUES (uid, 'steps', pts, now())
        ON CONFLICT (user_id, category)
        DO UPDATE SET 
          total_points = public.user_points.total_points + EXCLUDED.total_points,
          updated_at = now();
        
        RAISE NOTICE 'Awarded % points to user % for step completion', pts, uid;
      EXCEPTION WHEN others THEN
        RAISE NOTICE 'Points award failed but step completion proceeding: %', SQLERRM;
      END;
    END IF;
    
    RETURN NEW;
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'award_step_points error (step completion proceeding): %', SQLERRM;
    RETURN NEW; -- Always return NEW to allow step completion
  END;
END;
$$;