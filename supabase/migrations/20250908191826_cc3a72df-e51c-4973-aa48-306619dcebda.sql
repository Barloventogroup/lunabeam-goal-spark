-- Retroactive Points Update Script (Fixed)
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
  existing_education_points integer := 0;
  existing_school_points integer := 0;
BEGIN
  -- First handle category consolidation before processing steps
  -- Merge "school" into "education" category
  SELECT COALESCE(total_points, 0) INTO existing_education_points
  FROM user_points 
  WHERE user_id = 'abaf24db-c52c-46db-873f-5a7669dbc6b7' AND category = 'education';
  
  SELECT COALESCE(total_points, 0) INTO existing_school_points
  FROM user_points 
  WHERE user_id = 'abaf24db-c52c-46db-873f-5a7669dbc6b7' AND category = 'school';

  -- If both exist, merge them
  IF existing_school_points > 0 THEN
    UPDATE user_points 
    SET total_points = existing_education_points + existing_school_points,
        updated_at = now()
    WHERE user_id = 'abaf24db-c52c-46db-873f-5a7669dbc6b7' AND category = 'education';
    
    DELETE FROM user_points 
    WHERE user_id = 'abaf24db-c52c-46db-873f-5a7669dbc6b7' AND category = 'school';
  END IF;

  -- Remove the old "steps" category since we now use proper domain categories
  DELETE FROM user_points WHERE category = 'steps';

  -- Process all completed steps that haven't been logged yet
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

  RAISE NOTICE 'Retroactive points update completed successfully!';
END $$;