-- Check all schemas for SECURITY DEFINER views, including system schemas
DO $$
DECLARE
    view_info RECORD;
    view_definition TEXT;
BEGIN
    RAISE NOTICE 'Checking all schemas for SECURITY DEFINER views...';
    
    -- Check views across all schemas, not just public
    FOR view_info IN 
        SELECT schemaname, viewname 
        FROM pg_views 
        WHERE schemaname IN ('public', 'auth', 'storage', 'extensions')
        ORDER BY schemaname, viewname
    LOOP
        -- Get the view definition
        SELECT definition INTO view_definition 
        FROM pg_views 
        WHERE schemaname = view_info.schemaname 
        AND viewname = view_info.viewname;
        
        -- Check if it contains SECURITY DEFINER
        IF view_definition ILIKE '%SECURITY DEFINER%' THEN
            RAISE NOTICE 'FOUND SECURITY DEFINER VIEW: %.% - Definition: %', 
                view_info.schemaname, view_info.viewname, 
                SUBSTRING(view_definition, 1, 200) || '...';
                
            -- Only drop if it's in public schema (don't touch system schemas)
            IF view_info.schemaname = 'public' THEN
                EXECUTE format('DROP VIEW IF EXISTS %I.%I CASCADE', 
                    view_info.schemaname, view_info.viewname);
                RAISE NOTICE 'Dropped public view: %.%', view_info.schemaname, view_info.viewname;
            ELSE
                RAISE NOTICE 'System view found (not dropping): %.%', 
                    view_info.schemaname, view_info.viewname;
            END IF;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'SECURITY DEFINER view scan completed';
END $$;