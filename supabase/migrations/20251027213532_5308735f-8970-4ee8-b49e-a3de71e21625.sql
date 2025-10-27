-- Add new columns to check_ins table for express check-in flow
ALTER TABLE check_ins 
ADD COLUMN IF NOT EXISTS step_id UUID REFERENCES steps(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS difficulty_rating VARCHAR(10);

-- Create index for faster step_id lookups
CREATE INDEX IF NOT EXISTS idx_check_ins_step_id ON check_ins(step_id);

-- Create index for source filtering
CREATE INDEX IF NOT EXISTS idx_check_ins_source ON check_ins(source);