-- Create a trigger to automatically create profiles when users sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, onboarding_complete)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'first_name', 'User'), false);
  RETURN NEW;
END;
$$;

-- Create trigger for new user signups
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- For existing users without profiles, create a basic profile entry
INSERT INTO public.profiles (user_id, first_name, onboarding_complete)
SELECT au.id, COALESCE(au.raw_user_meta_data ->> 'first_name', 'User'), false
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
WHERE p.user_id IS NULL;