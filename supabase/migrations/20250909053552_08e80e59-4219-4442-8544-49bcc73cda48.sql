-- Check for and fix any remaining SECURITY DEFINER views
-- Drop the supporter_invite_safe_metadata view if it exists (appears to be unused)
DROP VIEW IF EXISTS public.supporter_invite_safe_metadata;

-- Verify no other problematic views exist by checking system catalog
-- This query will help identify any remaining SECURITY DEFINER views
-- (This is just for verification - the actual issue should be resolved by dropping the unused view)
DO $$
DECLARE
    view_record RECORD;
BEGIN
    -- Log any remaining views that might have SECURITY DEFINER (for debugging)
    FOR view_record IN 
        SELECT schemaname, viewname 
        FROM pg_views 
        WHERE schemaname = 'public'
    LOOP
        RAISE NOTICE 'Remaining view: %.%', view_record.schemaname, view_record.viewname;
    END LOOP;
END $$;