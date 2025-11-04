-- Add missing role types and profile column
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'coach';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'teacher';

-- Add grade column to profiles if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS grade TEXT;