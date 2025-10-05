-- Add metadata column to goals table for storing wizard context
ALTER TABLE goals ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;