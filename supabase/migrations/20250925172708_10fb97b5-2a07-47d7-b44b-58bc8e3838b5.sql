-- Add created_by field to goals table (no foreign key constraint to avoid issues)
ALTER TABLE public.goals ADD COLUMN created_by UUID;

-- Set created_by to owner_id for existing goals (they created their own goals)
UPDATE public.goals SET created_by = owner_id;

-- Make created_by not null after setting values
ALTER TABLE public.goals ALTER COLUMN created_by SET NOT NULL;

-- Update RLS policies to allow both creators and owners to view/edit goals
DROP POLICY IF EXISTS "Users can view their own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can update their own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can delete their own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can create their own goals" ON public.goals;

-- New policies allowing access for both owner and creator
CREATE POLICY "Users can view goals they own or created" ON public.goals
FOR SELECT USING (auth.uid() = owner_id OR auth.uid() = created_by);

CREATE POLICY "Users can update goals they own or created" ON public.goals
FOR UPDATE USING (auth.uid() = owner_id OR auth.uid() = created_by);

CREATE POLICY "Users can delete goals they own or created" ON public.goals
FOR DELETE USING (auth.uid() = owner_id OR auth.uid() = created_by);

CREATE POLICY "Users can create goals they own or for others" ON public.goals
FOR INSERT WITH CHECK (auth.uid() = owner_id OR auth.uid() = created_by);

-- Index for better performance on created_by queries
CREATE INDEX idx_goals_created_by ON public.goals(created_by);