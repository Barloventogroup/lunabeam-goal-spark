-- Award points retroactively for any existing completed substeps that haven't been awarded yet
DO $$
DECLARE
  substep_record RECORD;
  uid uuid;
  goal_category text;
  pts integer := 2;
BEGIN
  -- Find all completed substeps that haven't awarded points yet
  FOR substep_record IN 
    SELECT s.id, s.step_id, s.completed_at
    FROM public.substeps s
    WHERE s.completed_at IS NOT NULL 
    AND NOT EXISTS (
      SELECT 1 FROM public.points_log pl 
      WHERE pl.substep_id = s.id
    )
  LOOP
    -- Get user and category info
    SELECT g.owner_id, 
           CASE COALESCE(g.domain, '')
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
           END
    INTO uid, goal_category
    FROM public.goals g 
    JOIN public.steps st ON st.goal_id = g.id
    WHERE st.id = substep_record.step_id;
    
    IF uid IS NOT NULL THEN
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
      WHERE id = (SELECT goal_id FROM public.steps WHERE id = substep_record.step_id);

      -- Log the point award
      INSERT INTO public.points_log (
        user_id, goal_id, substep_id, category, step_type, points_awarded, awarded_at
      ) VALUES (
        uid, 
        (SELECT goal_id FROM public.steps WHERE id = substep_record.step_id),
        substep_record.id, 
        goal_category, 
        'scaffolding', 
        pts,
        substep_record.completed_at
      );
      
      RAISE NOTICE 'Awarded % points retroactively for substep %', pts, substep_record.id;
    END IF;
  END LOOP;
END $$;