-- Add authentication status to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS authentication_status TEXT DEFAULT 'pending' 
CHECK (authentication_status IN ('pending', 'authenticated', 'disabled'));

-- Add password_set flag 
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS password_set BOOLEAN DEFAULT false;

-- Update existing profiles to authenticated if they have account_status = 'user_claimed'
UPDATE public.profiles 
SET authentication_status = 'authenticated', password_set = true 
WHERE account_status = 'user_claimed';

-- Update existing profiles to authenticated if they're regular users
UPDATE public.profiles 
SET authentication_status = 'authenticated', password_set = true 
WHERE account_status = 'active' AND created_by_supporter IS NULL;