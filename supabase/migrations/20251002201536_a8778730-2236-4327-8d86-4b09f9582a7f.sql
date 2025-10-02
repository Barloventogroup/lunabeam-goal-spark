-- Create a security definer function to safely create steps
CREATE OR REPLACE FUNCTION public.create_step_secure(
  p_goal_id uuid,
  p_title text,
  p_notes text DEFAULT NULL,
  p_step_type text DEFAULT 'habit',
  p_estimated_effort_min integer DEFAULT NULL,
  p_is_planned boolean DEFAULT true,
  p_due_date date DEFAULT NULL
)
RETURNS uuid
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  _current_user uuid := auth.uid();
  _goal_owner uuid;
  _new_step_id uuid;
  _max_order integer;
BEGIN
  -- Check authentication
  IF _current_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verify user owns the goal
  SELECT owner_id INTO _goal_owner 
  FROM goals 
  WHERE id = p_goal_id;
  
  IF _goal_owner IS NULL THEN
    RAISE EXCEPTION 'Goal not found';
  END IF;
  
  IF _goal_owner != _current_user THEN
    RAISE EXCEPTION 'Unauthorized: You do not own this goal';
  END IF;
  
  -- Get the next order index
  SELECT COALESCE(MAX(order_index), -1) + 1 INTO _max_order
  FROM steps
  WHERE goal_id = p_goal_id;
  
  -- Insert step
  INSERT INTO steps (
    goal_id, 
    title, 
    notes, 
    step_type, 
    estimated_effort_min, 
    is_planned, 
    status,
    order_index,
    due_date
  ) VALUES (
    p_goal_id, 
    p_title, 
    p_notes, 
    p_step_type,
    p_estimated_effort_min, 
    p_is_planned, 
    'not_started',
    _max_order,
    p_due_date
  ) RETURNING id INTO _new_step_id;
  
  RETURN _new_step_id;
END;
$$;