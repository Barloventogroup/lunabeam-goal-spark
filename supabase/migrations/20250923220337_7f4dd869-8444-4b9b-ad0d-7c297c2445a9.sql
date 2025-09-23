-- Add user_type field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN user_type text DEFAULT 'individual' CHECK (user_type IN ('admin', 'individual'));

-- Set existing users based on current logic
UPDATE public.profiles 
SET user_type = CASE 
  WHEN created_by_supporter IS NULL THEN 'admin'
  ELSE 'individual'
END;

-- Make the field NOT NULL after setting defaults
ALTER TABLE public.profiles 
ALTER COLUMN user_type SET NOT NULL;