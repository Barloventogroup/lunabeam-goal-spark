-- Create step_check_ins table for immutable logging of all step check-in events

-- Create table
CREATE TABLE public.step_check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id UUID NOT NULL REFERENCES public.steps(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  check_in_type TEXT NOT NULL CHECK (check_in_type IN ('completion', 'deferral', 'difficulty_only')),
  completed BOOLEAN NOT NULL DEFAULT false,
  difficulty_rating TEXT CHECK (difficulty_rating IN ('easy', 'okay', 'hard')),
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  was_on_time BOOLEAN,
  deferred_reason TEXT CHECK (deferred_reason IN ('user_postponed', 'split_requested', 'evening_catch_up')),
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'express', 'notification', 'catch_up', 'voice')),
  initiated_before_checkin BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_step_check_ins_step_id ON public.step_check_ins(step_id);
CREATE INDEX idx_step_check_ins_user_checked_in ON public.step_check_ins(user_id, checked_in_at DESC);
CREATE INDEX idx_step_check_ins_difficulty ON public.step_check_ins(difficulty_rating) WHERE difficulty_rating IS NOT NULL;
CREATE INDEX idx_step_check_ins_source ON public.step_check_ins(source, checked_in_at DESC);

-- Enable RLS
ALTER TABLE public.step_check_ins ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can insert own check-ins"
  ON public.step_check_ins
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view relevant check-ins"
  ON public.step_check_ins
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR 
    user_id IN (SELECT individual_id FROM public.supporters WHERE supporter_id = auth.uid())
  );

CREATE POLICY "Can update difficulty within 10min"
  ON public.step_check_ins
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id 
    AND created_at > NOW() - INTERVAL '10 minutes' 
    AND check_in_type = 'completion'
  )
  WITH CHECK (difficulty_rating IS NOT NULL);

-- Add documentation comments
COMMENT ON TABLE public.step_check_ins IS 'Immutable log of all step check-in events for analytics and user insights. Tracks completions, deferrals, and difficulty ratings with source attribution.';
COMMENT ON COLUMN public.step_check_ins.initiated_before_checkin IS 'True if step.initiated_at was set before this check-in. Used to measure express vs. guided flow usage.';
COMMENT ON COLUMN public.step_check_ins.source IS 'Entry point for check-in: manual=Goals tab, express=Home tab, notification=from push, catch_up=evening batch, voice=voice interface';
COMMENT ON COLUMN public.step_check_ins.was_on_time IS 'True if checked in within ±30min of step due date. Used for punctuality analytics.';
COMMENT ON COLUMN public.step_check_ins.deferred_reason IS 'Why the step was deferred: user_postponed=manual reschedule, split_requested=broke into substeps, evening_catch_up=deferred via catch-up card';
COMMENT ON COLUMN public.step_check_ins.check_in_type IS 'Type of check-in: completion=step marked done, deferral=postponed to later, difficulty_only=retroactive difficulty rating';