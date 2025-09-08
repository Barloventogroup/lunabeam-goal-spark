-- Retroactive Points Update Script
-- This will award points for all completed steps that haven't been properly awarded yet

DO $$
DECLARE
  step_rec RECORD;
  pts integer;
  goal_category text;
  uid uuid;
  step_already_logged boolean;
  goal_bonus integer;
  all_planned_complete boolean;
  already_awarded_completion boolean;
BEGIN
  -- Process all completed steps
  FOR step_rec IN 
    SELECT s.id, s.goal_id, s.title, s.notes, s.step_type, s.points_awarded,
           g.domain, g.owner_id, g.goal_completion_bonus, g.earned_points
    FROM steps s 
    JOIN goals g ON s.goal_id = g.id 
    WHERE s.status = 'done'
    ORDER BY s.goal_id, s.id
  LOOP
    -- Map domain to proper category
    goal_category := CASE lower(step_rec.domain)
      WHEN 'school' THEN 'education'
      WHEN 'independent-living' THEN 'independent_living'
      WHEN 'education' THEN 'education'
      WHEN 'postsecondary' THEN 'postsecondary'
      WHEN 'recreation' THEN 'recreation_fun'
      WHEN 'social' THEN 'social_skills'
      WHEN 'employment' THEN 'employment'
      WHEN 'self-advocacy' THEN 'self_advocacy'
      WHEN 'health' THEN 'health'
      ELSE 'general'
    END;

    -- Check if this step has already been logged
    SELECT EXISTS(
      SELECT 1 FROM points_log 
      WHERE step_id = step_rec.id
    ) INTO step_already_logged;

    -- Skip if already logged
    IF step_already_logged THEN
      CONTINUE;
    END IF;

    -- Calculate points using new system
    pts := public.calculate_step_points_v2(
      goal_category,
      COALESCE(step_rec.step_type, 'habit'),
      step_rec.title,
      COALESCE(step_rec.notes, '')
    );

    -- Update step with points awarded
    UPDATE steps SET points_awarded = pts WHERE id = step_rec.id;

    -- Award points to user_points table (proper category)
    INSERT INTO user_points (user_id, category, total_points, updated_at)
    VALUES (step_rec.owner_id, goal_category, pts, now())
    ON CONFLICT (user_id, category)
    DO UPDATE SET 
      total_points = user_points.total_points + EXCLUDED.total_points,
      updated_at = now();

    -- Update goal earned_points
    UPDATE goals SET 
      earned_points = earned_points + pts,
      updated_at = now()
    WHERE id = step_rec.goal_id;

    -- Log the retroactive point award
    INSERT INTO points_log (
      user_id, goal_id, step_id, category, step_type, points_awarded, awarded_at
    ) VALUES (
      step_rec.owner_id, step_rec.goal_id, step_rec.id, goal_category, 
      COALESCE(step_rec.step_type, 'habit'), pts, now()
    );

    RAISE NOTICE 'Retroactively awarded % points for step: %', pts, step_rec.title;
  END LOOP;

  -- Now check for goal completion bonuses
  FOR step_rec IN 
    SELECT DISTINCT g.id, g.owner_id, g.domain, g.goal_completion_bonus
    FROM goals g 
    JOIN steps s ON g.id = s.goal_id 
    WHERE s.status = 'done'
  LOOP
    goal_category := CASE lower(step_rec.domain)
      WHEN 'school' THEN 'education'
      WHEN 'independent-living' THEN 'independent_living'
      WHEN 'education' THEN 'education'
      WHEN 'postsecondary' THEN 'postsecondary'
      WHEN 'recreation' THEN 'recreation_fun'
      WHEN 'social' THEN 'social_skills'
      WHEN 'employment' THEN 'employment'
      WHEN 'self-advocacy' THEN 'self_advocacy'
      WHEN 'health' THEN 'health'
      ELSE 'general'
    END;

    -- Check if all planned steps are complete
    SELECT NOT EXISTS(
      SELECT 1 FROM steps s 
      WHERE s.goal_id = step_rec.id 
      AND s.is_planned = true 
      AND s.status != 'done'
    ) INTO all_planned_complete;

    -- Check if completion bonus already awarded
    SELECT EXISTS(
      SELECT 1 FROM points_log pl
      WHERE pl.goal_id = step_rec.id 
      AND pl.step_type = 'goal_completion'
    ) INTO already_awarded_completion;

    -- Award goal completion bonus if applicable
    IF all_planned_complete AND NOT already_awarded_completion THEN
      goal_bonus := public.get_goal_completion_bonus(goal_category);
      
      -- Award completion bonus
      INSERT INTO user_points (user_id, category, total_points, updated_at)
      VALUES (step_rec.owner_id, goal_category, goal_bonus, now())
      ON CONFLICT (user_id, category)
      DO UPDATE SET 
        total_points = user_points.total_points + EXCLUDED.total_points,
        updated_at = now();

      -- Update goal earned_points
      UPDATE goals SET 
        earned_points = earned_points + goal_bonus,
        updated_at = now()
      WHERE id = step_rec.id;

      -- Log completion bonus
      INSERT INTO points_log (
        user_id, goal_id, category, step_type, points_awarded, awarded_at
      ) VALUES (
        step_rec.owner_id, step_rec.id, goal_category, 
        'goal_completion', goal_bonus, now()
      );

      RAISE NOTICE 'Awarded completion bonus of % points for goal %', goal_bonus, step_rec.id;
    END IF;
  END LOOP;

  -- Clean up any old category entries (like "steps", "school") and migrate to proper categories
  -- First, let's consolidate "school" into "education"
  UPDATE user_points 
  SET category = 'education'
  WHERE category = 'school';

  -- Remove the old "steps" category since we now use proper domain categories
  DELETE FROM user_points WHERE category = 'steps';

  RAISE NOTICE 'Retroactive points update completed successfully!';
END $$;