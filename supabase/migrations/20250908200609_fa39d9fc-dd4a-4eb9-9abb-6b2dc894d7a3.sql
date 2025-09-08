-- Fix search path security issue for existing functions
ALTER FUNCTION public.check_user_permission SET search_path TO 'public';
ALTER FUNCTION public.claim_account SET search_path TO 'public';
ALTER FUNCTION public.accept_supporter_invite_secure SET search_path TO 'public';
ALTER FUNCTION public.get_user_owned_circles SET search_path TO 'public';
ALTER FUNCTION public.get_user_member_circles SET search_path TO 'public';