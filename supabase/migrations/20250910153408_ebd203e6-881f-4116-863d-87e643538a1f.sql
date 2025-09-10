-- Drop the insecure my_received_invites view
-- This view was running with SECURITY DEFINER which is a security risk
-- The functionality is already available through the secure function get_my_received_invites()
DROP VIEW IF EXISTS public.my_received_invites;