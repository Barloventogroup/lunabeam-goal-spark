-- Safe fallback for points calculation to prevent step updates from failing
CREATE OR REPLACE FUNCTION public.calculate_step_points(step_title text, step_notes text, goal_domain text)
RETURNS integer
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  pts integer := 5; -- default
BEGIN
  IF step_title IS NULL THEN
    RETURN 5;
  END IF;

  -- Basic heuristics; always resolve to a value
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
END;
$$;

-- Harden award trigger to never abort the UPDATE when points logic has issues
CREATE OR REPLACE FUNCTION public.award_step_points()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $fn$
DECLARE
  pts integer := 0;
  uid uuid;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status = 'done' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    SELECT owner_id INTO uid FROM public.goals WHERE id = NEW.goal_id;

    -- Calculate points with a safe fallback
    pts := COALESCE(
      public.calculate_step_points(
        NEW.title,
        NEW.notes,
        (SELECT domain::text FROM public.goals WHERE id = NEW.goal_id)
      ),
      5
    );

    -- Try to upsert into user_points; if schema/table differs, do not block completion
    BEGIN
      INSERT INTO public.user_points (user_id, total_points, updated_at)
      VALUES (uid, pts, now())
      ON CONFLICT (user_id)
      DO UPDATE SET total_points = public.user_points.total_points + EXCLUDED.total_points,
                    updated_at = now();
    EXCEPTION WHEN undefined_table THEN
      RAISE NOTICE 'user_points table not found, skipping points award';
    WHEN undefined_column THEN
      RAISE NOTICE 'user_points schema mismatch, skipping points award';
    END;
  END IF;
  RETURN NEW;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'award_step_points error: %', SQLERRM;
  RETURN NEW; -- Never block the step update
END;
$fn$;