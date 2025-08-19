-- Add onboarding_complete column to profiles table
ALTER TABLE public.profiles ADD COLUMN onboarding_complete BOOLEAN NOT NULL DEFAULT false;

-- Create index for better performance
CREATE INDEX idx_profiles_onboarding_complete ON public.profiles(onboarding_complete);