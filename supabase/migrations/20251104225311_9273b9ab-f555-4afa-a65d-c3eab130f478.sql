-- Drop the existing SELECT policy for steps
DROP POLICY IF EXISTS "Users can view steps for goals they own or created" ON steps;

-- Create new SELECT policy that includes supporter access
CREATE POLICY "Users can view steps for goals they support"
ON steps
FOR SELECT
USING (
  goal_id IN (
    SELECT g.id 
    FROM goals g
    WHERE (
      g.owner_id = auth.uid() 
      OR g.created_by = auth.uid()
      OR EXISTS (
        SELECT 1 
        FROM supporters s 
        WHERE s.individual_id = g.owner_id 
        AND s.supporter_id = auth.uid()
      )
    )
  )
);

-- Also update UPDATE policy to allow supporters to update steps
DROP POLICY IF EXISTS "Users can update steps for goals they own or created" ON steps;

CREATE POLICY "Users can update steps for goals they support"
ON steps
FOR UPDATE
USING (
  goal_id IN (
    SELECT g.id 
    FROM goals g
    WHERE (
      g.owner_id = auth.uid() 
      OR g.created_by = auth.uid()
      OR EXISTS (
        SELECT 1 
        FROM supporters s 
        WHERE s.individual_id = g.owner_id 
        AND s.supporter_id = auth.uid()
      )
    )
  )
);

-- Also update INSERT policy to allow supporters to create steps
DROP POLICY IF EXISTS "Users can create steps for goals they own or created" ON steps;

CREATE POLICY "Users can create steps for goals they support"
ON steps
FOR INSERT
WITH CHECK (
  goal_id IN (
    SELECT g.id 
    FROM goals g
    WHERE (
      g.owner_id = auth.uid() 
      OR g.created_by = auth.uid()
      OR EXISTS (
        SELECT 1 
        FROM supporters s 
        WHERE s.individual_id = g.owner_id 
        AND s.supporter_id = auth.uid()
      )
    )
  )
);