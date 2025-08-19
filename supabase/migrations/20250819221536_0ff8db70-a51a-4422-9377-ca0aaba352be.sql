-- Drop existing goals table and create new structure
DROP TABLE IF EXISTS public.goals CASCADE;
DROP TABLE IF EXISTS public.steps CASCADE;

-- Create new goals table per spec
CREATE TABLE public.goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  title VARCHAR(80) NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 80),
  description TEXT,
  domain VARCHAR(16) CHECK (domain IN ('school', 'work', 'life', 'health', 'other')),
  priority VARCHAR(8) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  start_date DATE,
  due_date DATE,
  status VARCHAR(12) NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'paused', 'completed', 'archived')),
  progress_pct NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (progress_pct >= 0 AND progress_pct <= 100),
  streak_count INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create steps table
CREATE TABLE public.steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  title VARCHAR(80) NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 80),
  notes TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  estimated_effort_min INTEGER,
  due_date DATE,
  status VARCHAR(12) NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'skipped', 'done')),
  is_required BOOLEAN NOT NULL DEFAULT true,
  points INTEGER,
  dependency_step_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes per spec
CREATE INDEX idx_goals_owner_status_due ON public.goals(owner_id, status, due_date);
CREATE INDEX idx_steps_goal_order ON public.steps(goal_id, order_index);
CREATE INDEX idx_steps_goal_status ON public.steps(goal_id, status);

-- Add validation for due dates
ALTER TABLE public.goals ADD CONSTRAINT check_goal_dates 
  CHECK (due_date IS NULL OR start_date IS NULL OR due_date >= start_date);

-- Enable RLS
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.steps ENABLE ROW LEVEL SECURITY;

-- RLS policies for goals
CREATE POLICY "Users can create their own goals" 
ON public.goals FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can view their own goals" 
ON public.goals FOR SELECT 
USING (auth.uid() = owner_id);

CREATE POLICY "Users can update their own goals" 
ON public.goals FOR UPDATE 
USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own goals" 
ON public.goals FOR DELETE 
USING (auth.uid() = owner_id);

-- RLS policies for steps
CREATE POLICY "Users can create steps for their goals" 
ON public.steps FOR INSERT 
WITH CHECK (goal_id IN (SELECT id FROM public.goals WHERE owner_id = auth.uid()));

CREATE POLICY "Users can view steps for their goals" 
ON public.steps FOR SELECT 
USING (goal_id IN (SELECT id FROM public.goals WHERE owner_id = auth.uid()));

CREATE POLICY "Users can update steps for their goals" 
ON public.steps FOR UPDATE 
USING (goal_id IN (SELECT id FROM public.goals WHERE owner_id = auth.uid()));

CREATE POLICY "Users can delete steps for their goals" 
ON public.steps FOR DELETE 
USING (goal_id IN (SELECT id FROM public.goals WHERE owner_id = auth.uid()));

-- Create progress computation trigger
CREATE OR REPLACE FUNCTION recompute_goal_progress() RETURNS trigger AS $$
BEGIN
  UPDATE goals g SET
    progress_pct = COALESCE((
      SELECT CASE
               WHEN COUNT(*) FILTER (WHERE s.is_required) = 0 THEN 0
               ELSE ROUND(100.0 * COUNT(*) FILTER (WHERE s.is_required AND s.status='done')
                    / COUNT(*) FILTER (WHERE s.is_required), 2)
             END
      FROM steps s WHERE s.goal_id = g.id
    ), 0),
    updated_at = now()
  WHERE g.id = COALESCE(NEW.goal_id, OLD.goal_id);
  RETURN NULL;
END; $$ LANGUAGE plpgsql;

-- Create trigger for automatic progress computation
DROP TRIGGER IF EXISTS trg_steps_progress ON steps;
CREATE TRIGGER trg_steps_progress
AFTER INSERT OR UPDATE OR DELETE ON steps
FOR EACH ROW EXECUTE FUNCTION recompute_goal_progress();

-- Create trigger for updated_at on goals
CREATE TRIGGER update_goals_updated_at
BEFORE UPDATE ON public.goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on steps
CREATE TRIGGER update_steps_updated_at
BEFORE UPDATE ON public.steps
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();