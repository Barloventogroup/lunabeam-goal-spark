-- Create rewards table
CREATE TABLE public.rewards (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('small', 'medium', 'big')),
    point_cost INTEGER NOT NULL CHECK (point_cost >= 10 AND point_cost <= 10000),
    description TEXT,
    image TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for rewards
CREATE POLICY "Users can view all active rewards" 
ON public.rewards 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Supporters can manage rewards" 
ON public.rewards 
FOR ALL 
USING (owner_id = auth.uid());

-- Create redemptions table
CREATE TABLE public.redemptions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    reward_id UUID NOT NULL,
    user_id UUID NOT NULL,
    requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'fulfilled', 'denied')),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID,
    fulfilled_at TIMESTAMP WITH TIME ZONE,
    notes TEXT
);

-- Enable RLS
ALTER TABLE public.redemptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for redemptions
CREATE POLICY "Users can view their own redemptions" 
ON public.redemptions 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create redemption requests" 
ON public.redemptions 
FOR INSERT 
WITH CHECK (user_id = auth.uid() AND status = 'pending');

CREATE POLICY "Supporters can manage redemptions" 
ON public.redemptions 
FOR ALL 
USING (reward_id IN (SELECT id FROM public.rewards WHERE owner_id = auth.uid()));

-- Create function to process redemption approval
CREATE OR REPLACE FUNCTION public.process_redemption_approval(p_redemption_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    redemption_record RECORD;
    reward_cost INTEGER;
    current_user_id UUID := auth.uid();
BEGIN
    -- Get redemption details
    SELECT r.*, rw.point_cost, rw.name as reward_name
    INTO redemption_record
    FROM public.redemptions r
    JOIN public.rewards rw ON r.reward_id = rw.id
    WHERE r.id = p_redemption_id AND r.status = 'pending';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Redemption not found or already processed';
    END IF;
    
    -- Check if current user owns the reward
    IF NOT EXISTS (
        SELECT 1 FROM public.rewards 
        WHERE id = redemption_record.reward_id AND owner_id = current_user_id
    ) THEN
        RAISE EXCEPTION 'Unauthorized: You do not own this reward';
    END IF;
    
    -- Deduct points from user
    INSERT INTO public.user_points (user_id, category, total_points, updated_at)
    VALUES (redemption_record.user_id, 'redemptions', -redemption_record.point_cost, now())
    ON CONFLICT (user_id, category)
    DO UPDATE SET 
        total_points = public.user_points.total_points + EXCLUDED.total_points,
        updated_at = now();
    
    -- Log the point deduction
    INSERT INTO public.points_log (
        user_id, 
        goal_id, 
        category, 
        step_type, 
        points_awarded
    ) VALUES (
        redemption_record.user_id,
        NULL, -- No specific goal
        'redemptions',
        'redemption',
        -redemption_record.point_cost
    );
    
    -- Update redemption status
    UPDATE public.redemptions 
    SET 
        status = 'approved',
        approved_at = now(),
        approved_by = current_user_id
    WHERE id = p_redemption_id;
END;
$$;

-- Create updated_at trigger for rewards
CREATE TRIGGER update_rewards_updated_at
    BEFORE UPDATE ON public.rewards
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();