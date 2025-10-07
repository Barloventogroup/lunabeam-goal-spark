-- Phase 3: Add Foreign Key Constraints to supporters table (handle admin trigger)

-- Step 1: Temporarily disable the admin trigger
ALTER TABLE public.supporters DISABLE TRIGGER ensure_at_least_one_admin_trigger;

-- Step 2: Delete orphaned supporter records (no matching profile)
DELETE FROM public.supporters 
WHERE supporter_id NOT IN (SELECT user_id FROM public.profiles);

DELETE FROM public.supporters 
WHERE individual_id NOT IN (SELECT user_id FROM public.profiles);

-- Step 3: Re-enable the admin trigger
ALTER TABLE public.supporters ENABLE TRIGGER ensure_at_least_one_admin_trigger;

-- Step 4: Add foreign key constraints
ALTER TABLE public.supporters 
ADD CONSTRAINT fk_supporter_profile 
FOREIGN KEY (supporter_id) 
REFERENCES public.profiles(user_id) 
ON DELETE CASCADE;

ALTER TABLE public.supporters 
ADD CONSTRAINT fk_individual_profile 
FOREIGN KEY (individual_id) 
REFERENCES public.profiles(user_id) 
ON DELETE CASCADE;

-- Step 5: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_supporters_supporter_id ON public.supporters(supporter_id);
CREATE INDEX IF NOT EXISTS idx_supporters_individual_id ON public.supporters(individual_id);