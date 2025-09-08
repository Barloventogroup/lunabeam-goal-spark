-- Add missing 'type' column to steps table
ALTER TABLE public.steps ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'action';

-- Add index for better performance on type queries
CREATE INDEX IF NOT EXISTS idx_steps_type ON public.steps(type);