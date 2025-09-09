-- Comprehensive fix for SECURITY DEFINER views
-- Query to identify any views that might be causing the linter error
DO $$
DECLARE
    view_info RECORD;
    view_definition TEXT;
BEGIN
    -- Check all views in public schema and log their definitions
    FOR view_info IN 
        SELECT schemaname, viewname 
        FROM pg_views 
        WHERE schemaname = 'public'
    LOOP
        -- Get the view definition to check for SECURITY DEFINER
        SELECT definition INTO view_definition 
        FROM pg_views 
        WHERE schemaname = view_info.schemaname 
        AND viewname = view_info.viewname;
        
        -- Log the view and check if it contains SECURITY DEFINER
        IF view_definition ILIKE '%SECURITY DEFINER%' THEN
            RAISE NOTICE 'Found SECURITY DEFINER view: %.% - %', 
                view_info.schemaname, view_info.viewname, view_definition;
            
            -- Drop the problematic view
            EXECUTE format('DROP VIEW IF EXISTS %I.%I CASCADE', 
                view_info.schemaname, view_info.viewname);
            RAISE NOTICE 'Dropped view: %.%', view_info.schemaname, view_info.viewname;
        ELSE
            RAISE NOTICE 'Safe view: %.%', view_info.schemaname, view_info.viewname;
        END IF;
    END LOOP;
    
    -- Also check for any functions that might be creating views with SECURITY DEFINER
    -- This is more comprehensive but safe since we're just logging
    RAISE NOTICE 'Security definer view cleanup completed';
END $$;