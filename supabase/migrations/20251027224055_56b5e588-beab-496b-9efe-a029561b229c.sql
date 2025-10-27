-- Migration: Add check-in tracking columns and features
-- Date: 2025-01-27
-- Description: Adds completion_method, friction_score, notification settings,
--              notification_logs table, and helper functions for resilience bonuses

BEGIN;

-- =====================================================
-- 1. ADD COLUMNS TO steps TABLE
-- =====================================================
ALTER TABLE public.steps 
ADD COLUMN completion_method TEXT CHECK (completion_method IN ('substeps', 'quick_checkin', 'manual', 'bulk')),
ADD COLUMN friction_score INTEGER DEFAULT 0 CHECK (friction_score >= 0 AND friction_score <= 5),
ADD COLUMN last_deferred_at TIMESTAMPTZ,
ADD COLUMN snooze_count INTEGER DEFAULT 0 CHECK (snooze_count >= 0);

-- =====================================================
-- 2. ADD COLUMNS TO profiles TABLE  
-- =====================================================
ALTER TABLE public.profiles
ADD COLUMN notification_settings JSONB DEFAULT '{
  "heads_up_enabled": true,
  "follow_up_enabled": true,
  "catch_up_enabled": true,
  "catch_up_time": "20:00",
  "quiet_hours_enabled": false,
  "quiet_hours_start": "22:00",
  "quiet_hours_end": "08:00",
  "snooze_limit": 1,
  "difficulty_prompt_enabled": true
}'::jsonb,
ADD COLUMN resilience_bonus_earned INTEGER DEFAULT 0 CHECK (resilience_bonus_earned >= 0);

-- =====================================================
-- 3. ADD COLUMN TO substeps TABLE
-- =====================================================
ALTER TABLE public.substeps
ADD COLUMN created_by TEXT DEFAULT 'user' CHECK (created_by IN ('user', 'ai-split', 'ai-split-edited', 'ai-coach'));

-- =====================================================
-- 4. CREATE notification_logs TABLE
-- =====================================================
CREATE TABLE public.notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step_id UUID REFERENCES public.steps(id) ON DELETE SET NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('heads_up', 'follow_up', 'catch_up')),
  scheduled_for TIMESTAMPTZ NOT NULL,
  delivered_at TIMESTAMPTZ,
  interacted_at TIMESTAMPTZ,
  interaction_type TEXT CHECK (interaction_type IN ('tapped', 'dismissed', 'snoozed', 'background_completed')),
  was_suppressed BOOLEAN DEFAULT false,
  suppression_reason TEXT CHECK (suppression_reason IN ('quiet_hours', 'already_complete', 'user_active')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 5. CREATE INDEXES
-- =====================================================
CREATE INDEX idx_notification_logs_user_scheduled ON public.notification_logs(user_id, scheduled_for DESC);
CREATE INDEX idx_notification_logs_type ON public.notification_logs(notification_type, delivered_at);
CREATE INDEX idx_notification_logs_suppressed ON public.notification_logs(was_suppressed) WHERE was_suppressed = true;

-- =====================================================
-- 6. ENABLE RLS
-- =====================================================
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 7. CREATE RLS POLICIES
-- =====================================================
CREATE POLICY "Users view own notifications"
  ON public.notification_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service can insert notifications"
  ON public.notification_logs
  FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- 8. ADD COLUMN COMMENTS
-- =====================================================
COMMENT ON COLUMN public.steps.completion_method IS 'Tracks HOW step was completed: substeps, quick_checkin, manual Goals tab, or bulk evening catch-up';
COMMENT ON COLUMN public.steps.friction_score IS 'Auto-incremented when step is snoozed/deferred. When >= 3, step becomes optional (is_required=false). Range: 0-5';
COMMENT ON COLUMN public.steps.last_deferred_at IS 'Timestamp of most recent deferral for analytics and follow-up notification logic';
COMMENT ON COLUMN public.steps.snooze_count IS 'Count of snoozes for this step. Feeds into friction_score calculation';

COMMENT ON COLUMN public.profiles.notification_settings IS 'User notification preferences: heads-up, follow-up, catch-up times, quiet hours, snooze limits, difficulty prompts';
COMMENT ON COLUMN public.profiles.resilience_bonus_earned IS 'Cumulative 5% bonus points earned for completing steps rated as "hard"';

COMMENT ON COLUMN public.substeps.created_by IS 'Origin of substep: user (manual), ai-split (AI divided), ai-split-edited (AI+user), ai-coach (AI suggested)';

COMMENT ON TABLE public.notification_logs IS 'Immutable log of all notification events for analytics, debugging, and user insights';
COMMENT ON COLUMN public.notification_logs.scheduled_for IS 'When notification was originally scheduled to be delivered';
COMMENT ON COLUMN public.notification_logs.delivered_at IS 'When notification was actually delivered to device (null if suppressed)';
COMMENT ON COLUMN public.notification_logs.interacted_at IS 'When user tapped, dismissed, or snoozed the notification';
COMMENT ON COLUMN public.notification_logs.was_suppressed IS 'True if notification was prevented from delivery due to quiet hours, completion, or user activity';

-- =====================================================
-- 9. CREATE HELPER FUNCTION: increment_friction_score
-- =====================================================
CREATE OR REPLACE FUNCTION public.increment_friction_score(p_step_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_score INTEGER;
BEGIN
  -- Increment friction_score by 1, cap at 5
  UPDATE public.steps
  SET 
    friction_score = LEAST(friction_score + 1, 5),
    is_required = CASE 
      WHEN LEAST(friction_score + 1, 5) >= 3 THEN false 
      ELSE is_required 
    END,
    updated_at = NOW()
  WHERE id = p_step_id
  RETURNING friction_score INTO new_score;
  
  RETURN COALESCE(new_score, 0);
END;
$$;

COMMENT ON FUNCTION public.increment_friction_score(UUID) IS 'Increments friction_score by 1 (max 5). If score >= 3, marks step as optional. Returns new score.';

-- =====================================================
-- 10. CREATE HELPER FUNCTION: award_resilience_bonus
-- =====================================================
CREATE OR REPLACE FUNCTION public.award_resilience_bonus(
  p_user_id UUID,
  p_step_id UUID,
  p_base_points INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  was_hard BOOLEAN := false;
  bonus_amount INTEGER := 0;
  goal_category TEXT;
BEGIN
  -- Check if previous check-in for this step was rated 'hard'
  SELECT difficulty_rating = 'hard' INTO was_hard
  FROM public.step_check_ins
  WHERE step_id = p_step_id 
    AND difficulty_rating IS NOT NULL
  ORDER BY checked_in_at DESC
  LIMIT 1;
  
  -- If it was hard, award 5% bonus
  IF was_hard THEN
    bonus_amount := GREATEST(ROUND(p_base_points * 0.05), 1);
    
    -- Get goal category for points_log
    SELECT g.domain INTO goal_category
    FROM public.goals g
    JOIN public.steps s ON s.goal_id = g.id
    WHERE s.id = p_step_id;
    
    -- Map domain to category
    goal_category := CASE COALESCE(goal_category, '')
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
    
    -- Log bonus points
    INSERT INTO public.points_log (
      user_id, 
      goal_id, 
      step_id, 
      category, 
      step_type, 
      points_awarded
    ) VALUES (
      p_user_id,
      (SELECT goal_id FROM public.steps WHERE id = p_step_id),
      p_step_id,
      goal_category,
      'resilience_bonus',
      bonus_amount
    );
    
    -- Add to user_points
    INSERT INTO public.user_points (user_id, category, total_points, updated_at)
    VALUES (p_user_id, goal_category, bonus_amount, NOW())
    ON CONFLICT (user_id, category)
    DO UPDATE SET 
      total_points = public.user_points.total_points + EXCLUDED.total_points,
      updated_at = NOW();
    
    -- Increment resilience bonus counter
    UPDATE public.profiles
    SET resilience_bonus_earned = resilience_bonus_earned + bonus_amount
    WHERE user_id = p_user_id;
  END IF;
  
  RETURN bonus_amount;
END;
$$;

COMMENT ON FUNCTION public.award_resilience_bonus(UUID, UUID, INTEGER) IS 'Awards 5% bonus points if previous check-in was rated "hard". Returns bonus amount (0 if not triggered).';

COMMIT;

-- =====================================================
-- ROLLBACK INSTRUCTIONS
-- =====================================================
-- DROP FUNCTION IF EXISTS public.award_resilience_bonus(UUID, UUID, INTEGER);
-- DROP FUNCTION IF EXISTS public.increment_friction_score(UUID);
-- DROP TABLE IF EXISTS public.notification_logs CASCADE;
-- ALTER TABLE public.substeps DROP COLUMN IF EXISTS created_by;
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS resilience_bonus_earned;
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS notification_settings;
-- ALTER TABLE public.steps DROP COLUMN IF EXISTS snooze_count;
-- ALTER TABLE public.steps DROP COLUMN IF EXISTS last_deferred_at;
-- ALTER TABLE public.steps DROP COLUMN IF EXISTS friction_score;
-- ALTER TABLE public.steps DROP COLUMN IF EXISTS completion_method;