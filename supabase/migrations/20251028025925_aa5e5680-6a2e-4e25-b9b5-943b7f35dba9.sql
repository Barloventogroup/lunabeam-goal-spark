-- Phase 1: Add new columns to steps table for scaffolding
ALTER TABLE steps 
ADD COLUMN IF NOT EXISTS parent_step_id uuid REFERENCES steps(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS is_scaffolding boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS scaffolding_level integer DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_steps_parent_step_id ON steps(parent_step_id);

COMMENT ON COLUMN steps.parent_step_id IS 'Parent step ID if this is a scaffolding step (created via Break it down)';
COMMENT ON COLUMN steps.is_scaffolding IS 'True if this step was created via Break it down';
COMMENT ON COLUMN steps.scaffolding_level IS 'Depth of scaffolding (0=original, 1=first breakdown, 2=second breakdown, etc)';

-- Phase 2: Migrate existing substeps to steps table
INSERT INTO steps (
  id,
  goal_id,
  title,
  notes,
  status,
  order_index,
  points,
  points_awarded,
  is_planned,
  due_date,
  initiated_at,
  created_at,
  updated_at,
  parent_step_id,
  is_scaffolding,
  scaffolding_level,
  is_required,
  type
)
SELECT 
  s.id,
  st.goal_id,
  s.title,
  s.description as notes,
  CASE 
    WHEN s.completed_at IS NOT NULL THEN 'done'
    WHEN s.initiated_at IS NOT NULL THEN 'in_progress'
    ELSE 'not_started'
  END as status,
  (SELECT order_index FROM steps WHERE id = s.step_id) + 1 + ROW_NUMBER() OVER (PARTITION BY s.step_id ORDER BY s.created_at),
  2 as points,
  s.points_awarded,
  s.is_planned,
  s.due_date,
  s.initiated_at,
  s.created_at,
  s.updated_at,
  s.step_id as parent_step_id,
  true as is_scaffolding,
  1 as scaffolding_level,
  true as is_required,
  'action' as type
FROM substeps s
JOIN steps st ON s.step_id = st.id
WHERE NOT EXISTS (
  SELECT 1 FROM steps WHERE id = s.id
);

-- Phase 3: Reorder all steps within each goal
WITH ranked_steps AS (
  SELECT 
    id,
    goal_id,
    ROW_NUMBER() OVER (PARTITION BY goal_id ORDER BY order_index, created_at) - 1 as new_order_index
  FROM steps
)
UPDATE steps
SET order_index = ranked_steps.new_order_index
FROM ranked_steps
WHERE steps.id = ranked_steps.id;

-- Phase 4: Archive substeps table
ALTER TABLE IF EXISTS substeps RENAME TO substeps_archived;

COMMENT ON TABLE substeps_archived IS 'Archived substeps table - migrated to steps table with is_scaffolding=true';