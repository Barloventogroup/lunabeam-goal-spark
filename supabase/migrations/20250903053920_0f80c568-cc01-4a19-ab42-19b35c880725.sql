-- Add explainer column to steps table to match TypeScript interface
ALTER TABLE public.steps 
ADD COLUMN explainer TEXT;