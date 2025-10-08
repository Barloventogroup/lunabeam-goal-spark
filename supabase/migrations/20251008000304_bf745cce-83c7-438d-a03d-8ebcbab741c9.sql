-- Add privacy settings columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS profile_visibility TEXT DEFAULT 'supporters' 
  CHECK (profile_visibility IN ('public', 'supporters', 'private'));

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS goal_sharing TEXT DEFAULT 'supporters'
  CHECK (goal_sharing IN ('all', 'supporters', 'private'));

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS progress_sharing TEXT DEFAULT 'weekly'
  CHECK (progress_sharing IN ('realtime', 'weekly', 'manual'));