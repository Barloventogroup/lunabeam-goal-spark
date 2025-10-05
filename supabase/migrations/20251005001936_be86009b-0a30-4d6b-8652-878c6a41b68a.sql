-- Create supporter_setup_steps table
CREATE TABLE supporter_setup_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  supporter_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  order_index integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'not_started',
  completed_at timestamptz,
  due_date date,
  estimated_effort_min integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE supporter_setup_steps ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Supporters can view their own setup steps"
  ON supporter_setup_steps FOR SELECT
  TO authenticated
  USING (supporter_id = auth.uid());

CREATE POLICY "Supporters can create their own setup steps"
  ON supporter_setup_steps FOR INSERT
  TO authenticated
  WITH CHECK (supporter_id = auth.uid());

CREATE POLICY "Supporters can update their own setup steps"
  ON supporter_setup_steps FOR UPDATE
  TO authenticated
  USING (supporter_id = auth.uid());

CREATE POLICY "Supporters can delete their own setup steps"
  ON supporter_setup_steps FOR DELETE
  TO authenticated
  USING (supporter_id = auth.uid());

-- Create index for performance
CREATE INDEX idx_supporter_setup_steps_goal_supporter 
  ON supporter_setup_steps(goal_id, supporter_id);