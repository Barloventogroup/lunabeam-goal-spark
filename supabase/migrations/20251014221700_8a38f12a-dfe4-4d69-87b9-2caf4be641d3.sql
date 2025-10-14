-- =====================================================
-- PROGRESSIVE MASTERY GOALS WITH SAFETY LOGGING MIGRATION
-- =====================================================

-- 1. UPDATE safety_violations_log table with missing columns
-- =====================================================

ALTER TABLE public.safety_violations_log 
ADD COLUMN IF NOT EXISTS user_age integer,
ADD COLUMN IF NOT EXISTS skill_level integer,
ADD COLUMN IF NOT EXISTS helper_notified boolean DEFAULT false;

-- Add CHECK constraint for skill_level (1-5 range)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'safety_violations_log_skill_level_check'
  ) THEN
    ALTER TABLE public.safety_violations_log 
    ADD CONSTRAINT safety_violations_log_skill_level_check 
    CHECK (skill_level IS NULL OR (skill_level >= 1 AND skill_level <= 5));
  END IF;
END $$;

-- Update violation_layer constraint to include all three layers
DO $$ 
BEGIN
  -- Drop old constraint if exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'safety_violations_log_violation_layer_check'
  ) THEN
    ALTER TABLE public.safety_violations_log 
    DROP CONSTRAINT safety_violations_log_violation_layer_check;
  END IF;
  
  -- Add new constraint
  ALTER TABLE public.safety_violations_log 
  ADD CONSTRAINT safety_violations_log_violation_layer_check 
  CHECK (violation_layer IN ('layer_1_keywords', 'layer_2_generation', 'layer_3_judge'));
END $$;

-- Make violation_reason NOT NULL (it should always be provided)
ALTER TABLE public.safety_violations_log 
ALTER COLUMN violation_reason SET NOT NULL;


-- 2. ADD INDEXES to safety_violations_log
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_safety_violations_created 
ON public.safety_violations_log (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_safety_violations_user 
ON public.safety_violations_log (user_id);

CREATE INDEX IF NOT EXISTS idx_safety_violations_layer 
ON public.safety_violations_log (violation_layer);


-- 3. UPDATE RLS POLICIES for safety_violations_log
-- =====================================================

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Compliance team can view all violations" ON public.safety_violations_log;
DROP POLICY IF EXISTS "System can insert violations" ON public.safety_violations_log;
DROP POLICY IF EXISTS "System can update notifications" ON public.safety_violations_log;

-- Policy: Only admins can view violations
CREATE POLICY "Admins can view all violations"
ON public.safety_violations_log
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.user_type = 'admin'
  )
);

-- Policy: System/Service role can insert violations (for edge functions)
CREATE POLICY "System can insert violations"
ON public.safety_violations_log
FOR INSERT
WITH CHECK (true);

-- Policy: System can update notification flags
CREATE POLICY "System can update notifications"
ON public.safety_violations_log
FOR UPDATE
USING (true)
WITH CHECK (true);


-- 4. ADD NEW COLUMNS TO goals TABLE
-- =====================================================

ALTER TABLE public.goals
ADD COLUMN IF NOT EXISTS pm_metadata jsonb,
ADD COLUMN IF NOT EXISTS ai_generation_metadata jsonb,
ADD COLUMN IF NOT EXISTS total_steps_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_step_position integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS completed_steps_count integer DEFAULT 0;

-- Add comments for clarity
COMMENT ON COLUMN public.goals.pm_metadata IS 'Progressive Mastery metadata: skillAssessment, smartStart, teachingHelper, currentPhase, etc.';
COMMENT ON COLUMN public.goals.ai_generation_metadata IS 'AI generation metadata: attempts, scores, safety checks, timestamps';
COMMENT ON COLUMN public.goals.total_steps_count IS 'Total number of steps planned for this goal';
COMMENT ON COLUMN public.goals.current_step_position IS 'Current position in the step sequence (0-indexed)';
COMMENT ON COLUMN public.goals.completed_steps_count IS 'Number of steps completed';


-- 5. ADD NEW COLUMNS TO steps TABLE
-- =====================================================

ALTER TABLE public.steps
ADD COLUMN IF NOT EXISTS pm_metadata jsonb,
ADD COLUMN IF NOT EXISTS quality_rating integer,
ADD COLUMN IF NOT EXISTS independence_rating integer,
ADD COLUMN IF NOT EXISTS completion_notes text;

-- Add CHECK constraints for ratings (1-5 range)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'steps_quality_rating_check'
  ) THEN
    ALTER TABLE public.steps 
    ADD CONSTRAINT steps_quality_rating_check 
    CHECK (quality_rating IS NULL OR (quality_rating >= 1 AND quality_rating <= 5));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'steps_independence_rating_check'
  ) THEN
    ALTER TABLE public.steps 
    ADD CONSTRAINT steps_independence_rating_check 
    CHECK (independence_rating IS NULL OR (independence_rating >= 1 AND independence_rating <= 5));
  END IF;
END $$;

-- Add comments for clarity
COMMENT ON COLUMN public.steps.pm_metadata IS 'Progressive Mastery step metadata: supportLevel, difficulty, weekNumber, phase, prerequisites, safetyNotes, teacherGuidance, etc.';
COMMENT ON COLUMN public.steps.quality_rating IS 'Quality rating from 1-5 after completion';
COMMENT ON COLUMN public.steps.independence_rating IS 'Independence level rating from 1-5 (1=full support, 5=fully independent)';
COMMENT ON COLUMN public.steps.completion_notes IS 'Notes recorded during step completion';


-- 6. ADD PERFORMANCE INDEX FOR PM GOALS
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_goals_user_pm 
ON public.goals (owner_id) 
WHERE goal_type = 'progressive_mastery';

-- Additional useful index for PM steps
CREATE INDEX IF NOT EXISTS idx_steps_goal_pm 
ON public.steps (goal_id) 
WHERE step_type IN ('habit', 'milestone', 'scaffolding');


-- 7. HELPER FUNCTION: Update step counts automatically
-- =====================================================

-- Function to update goal step counts
CREATE OR REPLACE FUNCTION public.update_goal_step_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update counts when step is inserted, updated, or deleted
  IF TG_OP = 'DELETE' THEN
    UPDATE public.goals
    SET 
      total_steps_count = (
        SELECT COUNT(*) FROM public.steps WHERE goal_id = OLD.goal_id
      ),
      completed_steps_count = (
        SELECT COUNT(*) FROM public.steps 
        WHERE goal_id = OLD.goal_id AND status = 'done'
      ),
      updated_at = now()
    WHERE id = OLD.goal_id;
    RETURN OLD;
  ELSE
    UPDATE public.goals
    SET 
      total_steps_count = (
        SELECT COUNT(*) FROM public.steps WHERE goal_id = NEW.goal_id
      ),
      completed_steps_count = (
        SELECT COUNT(*) FROM public.steps 
        WHERE goal_id = NEW.goal_id AND status = 'done'
      ),
      updated_at = now()
    WHERE id = NEW.goal_id;
    RETURN NEW;
  END IF;
END;
$$;

-- Trigger to automatically update step counts
DROP TRIGGER IF EXISTS trigger_update_goal_step_counts ON public.steps;
CREATE TRIGGER trigger_update_goal_step_counts
AFTER INSERT OR UPDATE OR DELETE ON public.steps
FOR EACH ROW
EXECUTE FUNCTION public.update_goal_step_counts();


-- 8. INITIALIZE EXISTING GOALS
-- =====================================================

-- Set step counts for existing goals that don't have them
UPDATE public.goals g
SET 
  total_steps_count = COALESCE((
    SELECT COUNT(*) FROM public.steps WHERE goal_id = g.id
  ), 0),
  completed_steps_count = COALESCE((
    SELECT COUNT(*) FROM public.steps WHERE goal_id = g.id AND status = 'done'
  ), 0),
  current_step_position = 0
WHERE total_steps_count IS NULL OR total_steps_count = 0;


-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Verify the migration
DO $$
DECLARE
  v_safety_cols integer;
  v_goals_cols integer;
  v_steps_cols integer;
BEGIN
  -- Check safety_violations_log columns
  SELECT COUNT(*) INTO v_safety_cols
  FROM information_schema.columns
  WHERE table_schema = 'public' 
  AND table_name = 'safety_violations_log'
  AND column_name IN ('user_age', 'skill_level', 'helper_notified');
  
  -- Check goals columns
  SELECT COUNT(*) INTO v_goals_cols
  FROM information_schema.columns
  WHERE table_schema = 'public' 
  AND table_name = 'goals'
  AND column_name IN ('pm_metadata', 'ai_generation_metadata', 'total_steps_count', 'current_step_position', 'completed_steps_count');
  
  -- Check steps columns
  SELECT COUNT(*) INTO v_steps_cols
  FROM information_schema.columns
  WHERE table_schema = 'public' 
  AND table_name = 'steps'
  AND column_name IN ('pm_metadata', 'quality_rating', 'independence_rating', 'completion_notes');
  
  RAISE NOTICE '✅ Migration verification:';
  RAISE NOTICE '   safety_violations_log: % of 3 columns added', v_safety_cols;
  RAISE NOTICE '   goals: % of 5 columns added', v_goals_cols;
  RAISE NOTICE '   steps: % of 4 columns added', v_steps_cols;
  
  IF v_safety_cols = 3 AND v_goals_cols = 5 AND v_steps_cols = 4 THEN
    RAISE NOTICE '✅ All columns added successfully!';
  ELSE
    RAISE WARNING '⚠️  Some columns may already exist or failed to add';
  END IF;
END $$;