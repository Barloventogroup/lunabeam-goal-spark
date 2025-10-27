-- Add due_date column to substeps table to support rescheduling
ALTER TABLE public.substeps 
ADD COLUMN IF NOT EXISTS due_date date;