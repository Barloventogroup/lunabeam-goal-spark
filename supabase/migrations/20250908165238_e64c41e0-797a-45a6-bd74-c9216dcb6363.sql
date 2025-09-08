-- Drop existing functions to recreate with proper parameters and error handling
DROP FUNCTION IF EXISTS public.calculate_step_points(text,text,text);
DROP FUNCTION IF EXISTS public.award_step_points();

-- Recreate with safe fallbacks to prevent step completion from ever failing
CREATE OR REPLACE FUNCTION public.calculate_step_points(step_title text, step_notes text DEFAULT '', goal_domain text DEFAULT '')
RETURNS integer
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  pts integer := 5; -- safe default
BEGIN
  -- Never let this function fail - always return a valid point value
  BEGIN
    IF step_title IS NULL OR step_title = '' THEN
      RETURN 5;
    END IF;

    -- Basic heuristics for point calculation
    IF step_title ILIKE '%week%' AND step_title ILIKE '%session%' THEN
      pts := 10;
    ELSIF step_title ILIKE '%write%' THEN
      pts := 8;
    ELSIF step_title ILIKE '%read%' THEN
      pts := 6;
    ELSIF step_title ILIKE '%walk%' OR step_title ILIKE '%stretch%' THEN
      pts := 6;
    ELSE
      pts := 5;
    END IF;

    RETURN pts;
  EXCEPTION WHEN others THEN
    -- If anything goes wrong, return default
    RETURN 5;
  END;
END;
$$;

-- Recreate trigger function with comprehensive error handling
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
        INSERT INTO public.user_points (user_id, total_points, updated_at)
        VALUES (uid, pts, now())
        ON CONFLICT (user_id)
        DO UPDATE SET 
          total_points = public.user_points.total_points + EXCLUDED.total_points,
          updated_at = now();
        
        RAISE NOTICE 'Awarded % points to user %', pts, uid;
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