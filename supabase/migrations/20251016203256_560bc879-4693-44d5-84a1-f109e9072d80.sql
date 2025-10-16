-- Add emoji-specific tracking columns to safety_violations_log
ALTER TABLE safety_violations_log 
ADD COLUMN IF NOT EXISTS triggered_emojis TEXT[],
ADD COLUMN IF NOT EXISTS triggered_emoji_codes TEXT[],
ADD COLUMN IF NOT EXISTS emoji_combination_detected BOOLEAN DEFAULT FALSE;