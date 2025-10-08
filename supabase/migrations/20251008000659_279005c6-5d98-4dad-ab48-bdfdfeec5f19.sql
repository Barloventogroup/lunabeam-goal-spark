-- Add flag to track if user has seen welcome animation
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS has_seen_welcome BOOLEAN DEFAULT false;