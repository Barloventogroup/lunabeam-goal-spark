-- Function to update habit goal progress based on unique completion days
CREATE OR REPLACE FUNCTION update_habit_goal_progress()
RETURNS TRIGGER AS $$
DECLARE
  v_goal_record goals%ROWTYPE;
  v_planned_days INTEGER;
  v_completed_days INTEGER;
  v_new_progress NUMERIC;
  v_streak_count INTEGER := 0;
  v_last_completed DATE;
  v_completion_dates DATE[];
  v_prev_date DATE;
  v_current_streak INTEGER := 0;
BEGIN
  -- Only proceed if step was just marked as 'done'
  IF TG_OP = 'UPDATE' AND NEW.status = 'done' AND OLD.status != 'done' THEN
    
    -- Get goal details
    SELECT * INTO v_goal_record 
    FROM goals 
    WHERE id = NEW.goal_id;
    
    -- Only process habit goals
    IF v_goal_record.frequency_per_week IS NOT NULL AND v_goal_record.frequency_per_week > 0 THEN
      
      -- Calculate planned days: frequency_per_week * duration_weeks
      v_planned_days := COALESCE(v_goal_record.frequency_per_week, 0) * COALESCE(v_goal_record.duration_weeks, 1);
      
      -- Count unique completion days for this goal
      SELECT COUNT(DISTINCT DATE(updated_at))
      INTO v_completed_days
      FROM steps
      WHERE goal_id = NEW.goal_id 
        AND status = 'done'
        AND updated_at IS NOT NULL;
      
      -- Calculate progress percentage
      IF v_planned_days > 0 THEN
        v_new_progress := (v_completed_days::NUMERIC / v_planned_days::NUMERIC) * 100;
        v_new_progress := LEAST(v_new_progress, 100); -- Cap at 100%
      ELSE
        v_new_progress := 0;
      END IF;
      
      -- Get all unique completion dates sorted
      SELECT ARRAY_AGG(completion_date ORDER BY completion_date DESC)
      INTO v_completion_dates
      FROM (
        SELECT DISTINCT DATE(updated_at) as completion_date
        FROM steps
        WHERE goal_id = NEW.goal_id 
          AND status = 'done'
          AND updated_at IS NOT NULL
      ) dates;
      
      -- Calculate streak (consecutive days)
      IF ARRAY_LENGTH(v_completion_dates, 1) > 0 THEN
        v_last_completed := v_completion_dates[1];
        v_current_streak := 1;
        v_prev_date := v_completion_dates[1];
        
        -- Iterate through dates to find consecutive streak
        FOR i IN 2..ARRAY_LENGTH(v_completion_dates, 1) LOOP
          IF v_prev_date - v_completion_dates[i] = 1 THEN
            v_current_streak := v_current_streak + 1;
            v_prev_date := v_completion_dates[i];
          ELSE
            EXIT; -- Break streak
          END IF;
        END LOOP;
        
        v_streak_count := v_current_streak;
      ELSE
        v_last_completed := NULL;
        v_streak_count := 0;
      END IF;
      
      -- Update goal with calculated metrics
      UPDATE goals
      SET 
        progress_pct = v_new_progress,
        streak_count = v_streak_count,
        last_completed_date = v_last_completed,
        updated_at = NOW()
      WHERE id = NEW.goal_id;
      
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_habit_goal_progress ON steps;
CREATE TRIGGER trigger_update_habit_goal_progress
  AFTER UPDATE ON steps
  FOR EACH ROW
  EXECUTE FUNCTION update_habit_goal_progress();