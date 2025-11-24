-- Add birthday column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS birthday DATE;

-- Add helpful comment
COMMENT ON COLUMN public.profiles.birthday IS 'User date of birth for personalization';

-- Add metadata column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add helpful comment
COMMENT ON COLUMN public.profiles.metadata IS 'Flexible storage for onboarding data, EF assessments, and other structured metadata';

-- Create index for common metadata queries (EF pillars)
CREATE INDEX IF NOT EXISTS idx_profiles_metadata_ef_pillars 
ON public.profiles USING gin ((metadata->'ef_selected_pillars'));