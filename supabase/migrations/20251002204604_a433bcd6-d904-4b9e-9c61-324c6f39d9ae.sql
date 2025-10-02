-- Fix RLS policies for steps table to allow access by both owner and creator
DROP POLICY IF EXISTS "Users can view steps for their goals" ON public.steps;
DROP POLICY IF EXISTS "Users can create steps for their goals" ON public.steps;
DROP POLICY IF EXISTS "Users can update steps for their goals" ON public.steps;
DROP POLICY IF EXISTS "Users can delete steps for their goals" ON public.steps;

CREATE POLICY "Users can view steps for goals they own or created"
ON public.steps
FOR SELECT
USING (
  goal_id IN (
    SELECT id FROM public.goals 
    WHERE owner_id = auth.uid() OR created_by = auth.uid()
  )
);

CREATE POLICY "Users can create steps for goals they own or created"
ON public.steps
FOR INSERT
WITH CHECK (
  goal_id IN (
    SELECT id FROM public.goals 
    WHERE owner_id = auth.uid() OR created_by = auth.uid()
  )
);

CREATE POLICY "Users can update steps for goals they own or created"
ON public.steps
FOR UPDATE
USING (
  goal_id IN (
    SELECT id FROM public.goals 
    WHERE owner_id = auth.uid() OR created_by = auth.uid()
  )
);

CREATE POLICY "Users can delete steps for goals they own or created"
ON public.steps
FOR DELETE
USING (
  goal_id IN (
    SELECT id FROM public.goals 
    WHERE owner_id = auth.uid() OR created_by = auth.uid()
  )
);

-- Fix RLS policies for substeps table to allow access by both owner and creator
DROP POLICY IF EXISTS "Users can view substeps for their goals" ON public.substeps;
DROP POLICY IF EXISTS "Users can create substeps for their goals" ON public.substeps;
DROP POLICY IF EXISTS "Users can update substeps for their goals" ON public.substeps;
DROP POLICY IF EXISTS "Users can delete substeps for their goals" ON public.substeps;

CREATE POLICY "Users can view substeps for goals they own or created"
ON public.substeps
FOR SELECT
USING (
  step_id IN (
    SELECT s.id FROM public.steps s
    JOIN public.goals g ON s.goal_id = g.id
    WHERE g.owner_id = auth.uid() OR g.created_by = auth.uid()
  )
);

CREATE POLICY "Users can create substeps for goals they own or created"
ON public.substeps
FOR INSERT
WITH CHECK (
  step_id IN (
    SELECT s.id FROM public.steps s
    JOIN public.goals g ON s.goal_id = g.id
    WHERE g.owner_id = auth.uid() OR g.created_by = auth.uid()
  )
);

CREATE POLICY "Users can update substeps for goals they own or created"
ON public.substeps
FOR UPDATE
USING (
  step_id IN (
    SELECT s.id FROM public.steps s
    JOIN public.goals g ON s.goal_id = g.id
    WHERE g.owner_id = auth.uid() OR g.created_by = auth.uid()
  )
);

CREATE POLICY "Users can delete substeps for goals they own or created"
ON public.substeps
FOR DELETE
USING (
  step_id IN (
    SELECT s.id FROM public.steps s
    JOIN public.goals g ON s.goal_id = g.id
    WHERE g.owner_id = auth.uid() OR g.created_by = auth.uid()
  )
);