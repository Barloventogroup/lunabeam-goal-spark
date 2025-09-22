-- Add initiated_at field to steps table to track when work begins
ALTER TABLE public.steps 
ADD COLUMN initiated_at timestamp with time zone;

-- Add initiated_at field to substeps table to track when work begins  
ALTER TABLE public.substeps 
ADD COLUMN initiated_at timestamp with time zone;

-- Update steps status enum to include 'in_progress' if not already present
-- First check if 'in_progress' status exists, if not we'll need to handle it in the app logic