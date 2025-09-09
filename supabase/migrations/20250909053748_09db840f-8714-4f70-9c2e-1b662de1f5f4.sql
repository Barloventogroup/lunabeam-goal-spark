-- More comprehensive search for SECURITY DEFINER views
-- Check system catalogs directly for views with SECURITY DEFINER
DO $$
DECLARE
    rec RECORD;
    view_sql TEXT;
BEGIN
    -- First, let's see all views in the database
    RAISE NOTICE 'Checking all views in database...';
    
    -- Check pg_rewrite for views that might have SECURITY DEFINER
    FOR rec IN 
        SELECT 
            n.nspname as schema_name,
            c.relname as view_name,
            r.ev_action
        FROM pg_rewrite r
        JOIN pg_class c ON c.oid = r.ev_class
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relkind = 'v' -- views only
        AND n.nspname IN ('public', 'auth', 'storage')
    LOOP
        -- Convert the rule action to text to check for SECURITY DEFINER
        view_sql := pg_get_viewdef(rec.view_name::regclass);
        
        IF view_sql ILIKE '%SECURITY DEFINER%' OR 
           rec.ev_action::text ILIKE '%SECURITY DEFINER%' THEN
            RAISE NOTICE 'Found problematic view: %.% with SECURITY DEFINER', 
                rec.schema_name, rec.view_name;
                
            -- Only drop if it's in public schema to be safe
            IF rec.schema_name = 'public' THEN
                EXECUTE format('DROP VIEW IF EXISTS %I.%I CASCADE', 
                    rec.schema_name, rec.view_name);
                RAISE NOTICE 'Dropped view: %.%', rec.schema_name, rec.view_name;
            END IF;
        END IF;
    END LOOP;
    
    -- Let's also check if there are any remaining views
    RAISE NOTICE 'Remaining public views after cleanup:';
    FOR rec IN 
        SELECT schemaname, viewname 
        FROM pg_views 
        WHERE schemaname = 'public'
    LOOP
        RAISE NOTICE 'View: %.%', rec.schemaname, rec.viewname;
    END LOOP;
    
    RAISE NOTICE 'SECURITY DEFINER view cleanup completed';
END $$;