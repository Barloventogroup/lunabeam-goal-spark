-- Add foreign key constraint between redemptions and rewards
ALTER TABLE public.redemptions 
ADD CONSTRAINT fk_redemptions_reward_id 
FOREIGN KEY (reward_id) REFERENCES public.rewards(id) 
ON DELETE CASCADE;