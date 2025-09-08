-- Test the points trigger by updating a step status
-- This should trigger the award_step_points function

DO $$
DECLARE
    completed_step_id UUID;
    step_goal_id UUID;
    goal_owner_id UUID;
BEGIN
    -- Find a completed step to re-trigger
    SELECT id, goal_id INTO completed_step_id, step_goal_id 
    FROM steps 
    WHERE status = 'done' 
    LIMIT 1;
    
    IF completed_step_id IS NOT NULL THEN
        -- Get the goal owner
        SELECT owner_id INTO goal_owner_id FROM goals WHERE id = step_goal_id;
        
        RAISE NOTICE 'Testing points trigger for step % owned by user %', completed_step_id, goal_owner_id;
        
        -- Temporarily set to not_started, then back to done to trigger the update
        UPDATE steps SET status = 'not_started' WHERE id = completed_step_id;
        UPDATE steps SET status = 'done' WHERE id = completed_step_id;
        
        RAISE NOTICE 'Points trigger test completed';
    ELSE
        RAISE NOTICE 'No completed steps found to test';
    END IF;
END $$;