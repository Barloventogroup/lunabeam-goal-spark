-- ============= PART 1: CREATE COOLDOWN STATE TRACKING TABLE =============
CREATE TABLE public.chat_cooldown_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step_id UUID NOT NULL,
  
  -- Irrelevance tracking
  irrelevance_count INTEGER NOT NULL DEFAULT 0,
  last_unrelated_at TIMESTAMPTZ,
  
  -- Cooldown tracking
  cooldown_level INTEGER NOT NULL DEFAULT 0, -- 0=none, 1=1-min, 2=5-min, 3=persistent
  cooldown_until TIMESTAMPTZ,
  cooldown_attempts_total INTEGER NOT NULL DEFAULT 0,
  
  -- Persistent lock state
  is_locked BOOLEAN NOT NULL DEFAULT false,
  lock_reason TEXT,
  locked_at TIMESTAMPTZ,
  reflection_submitted BOOLEAN DEFAULT false,
  reflection_q1 TEXT,
  reflection_q2 TEXT,
  reframing_statement TEXT,
  unlocked_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, step_id)
);

-- RLS Policies
ALTER TABLE public.chat_cooldown_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cooldown state"
  ON public.chat_cooldown_state FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cooldown state"
  ON public.chat_cooldown_state FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cooldown state"
  ON public.chat_cooldown_state FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Supporters can view individual cooldown state"
  ON public.chat_cooldown_state FOR SELECT
  USING (
    user_id IN (
      SELECT individual_id FROM public.supporters 
      WHERE supporter_id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Supporters can update individual cooldown state"
  ON public.chat_cooldown_state FOR UPDATE
  USING (
    user_id IN (
      SELECT individual_id FROM public.supporters 
      WHERE supporter_id = auth.uid() AND is_admin = true
    )
  );

-- Create index for faster lookups
CREATE INDEX idx_chat_cooldown_user_step ON public.chat_cooldown_state(user_id, step_id);

-- ============= PART 2: ADD IS_SELF_REGISTERED FLAG =============
ALTER TABLE public.profiles 
ADD COLUMN is_self_registered BOOLEAN NOT NULL DEFAULT true;

-- Update existing profiles: If created_by_supporter IS NOT NULL → they were provisioned
UPDATE public.profiles 
SET is_self_registered = false 
WHERE created_by_supporter IS NOT NULL;

-- Create trigger to set flag on new profile creation
CREATE OR REPLACE FUNCTION public.set_self_registered_flag()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_by_supporter IS NOT NULL THEN
    NEW.is_self_registered := false;
  ELSE
    NEW.is_self_registered := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_set_self_registered
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_self_registered_flag();

COMMENT ON COLUMN public.profiles.is_self_registered IS 
  'TRUE if user signed up themselves (even if they have admin role). FALSE if provisioned by a supporter.';

-- ============= PART 3: CREATE COOLDOWN EVENT LOG TABLE =============
CREATE TABLE public.cooldown_event_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step_id UUID NOT NULL,
  goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
  
  event_type TEXT NOT NULL CHECK (event_type IN (
    'unrelated_warning_1',
    'unrelated_warning_2',
    'cooldown_1min_triggered',
    'cooldown_5min_triggered',
    'persistent_lock_triggered',
    'reflection_submitted',
    'chat_unlocked',
    'supporter_override'
  )),
  
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.cooldown_event_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own event log"
  ON public.cooldown_event_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Supporters can view individual event log"
  ON public.cooldown_event_log FOR SELECT
  USING (
    user_id IN (
      SELECT individual_id FROM public.supporters 
      WHERE supporter_id = auth.uid()
    )
  );

-- Create indexes for analytics queries
CREATE INDEX idx_cooldown_event_user ON public.cooldown_event_log(user_id);
CREATE INDEX idx_cooldown_event_type ON public.cooldown_event_log(event_type);
CREATE INDEX idx_cooldown_event_created ON public.cooldown_event_log(created_at DESC);