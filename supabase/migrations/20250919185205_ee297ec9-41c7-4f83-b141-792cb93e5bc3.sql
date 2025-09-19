-- Create goal proposals table
CREATE TABLE public.goal_proposals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  individual_id UUID NOT NULL, -- Who the goal is for (the Subject)
  proposer_id UUID NOT NULL, -- Who suggested the goal
  title TEXT NOT NULL,
  description TEXT,
  category TEXT, -- Independent Living, Education, etc.
  outcome TEXT, -- SMART outcome description
  timeline_start DATE,
  timeline_end DATE,
  frequency_per_week INTEGER,
  rationale TEXT, -- Why this helps
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, declined, changes_requested
  admin_notes TEXT, -- Feedback from admin
  approved_by UUID, -- Admin who approved/declined
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.goal_proposals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for goal_proposals
-- Proposers can view their own proposals
CREATE POLICY "Proposers can view their proposals" 
ON public.goal_proposals 
FOR SELECT 
USING (proposer_id = auth.uid());

-- Individuals can view proposals for them
CREATE POLICY "Individuals can view proposals for them" 
ON public.goal_proposals 
FOR SELECT 
USING (individual_id = auth.uid());

-- Admins can view proposals for their individuals
CREATE POLICY "Admins can view proposals for their individuals" 
ON public.goal_proposals 
FOR SELECT 
USING (individual_id IN (
  SELECT s.individual_id FROM supporters s 
  WHERE s.supporter_id = auth.uid() AND s.is_admin = true
));

-- Anyone can create proposals (permissions checked in app logic)
CREATE POLICY "Users can create proposals" 
ON public.goal_proposals 
FOR INSERT 
WITH CHECK (proposer_id = auth.uid());

-- Admins can update proposals for their individuals
CREATE POLICY "Admins can update proposals" 
ON public.goal_proposals 
FOR UPDATE 
USING (individual_id IN (
  SELECT s.individual_id FROM supporters s 
  WHERE s.supporter_id = auth.uid() AND s.is_admin = true
))
WITH CHECK (individual_id IN (
  SELECT s.individual_id FROM supporters s 
  WHERE s.supporter_id = auth.uid() AND s.is_admin = true
));

-- Proposers can update their pending proposals
CREATE POLICY "Proposers can update pending proposals" 
ON public.goal_proposals 
FOR UPDATE 
USING (proposer_id = auth.uid() AND status = 'pending')
WITH CHECK (proposer_id = auth.uid());

-- Create notifications table for goal-related activities
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL, -- Who receives the notification
  type TEXT NOT NULL, -- proposal_submitted, proposal_approved, proposal_declined, goal_assigned, etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB, -- Additional data (goal_id, proposal_id, etc.)
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policy for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR ALL
USING (user_id = auth.uid());

-- Create trigger for updated_at on goal_proposals
CREATE TRIGGER update_goal_proposals_updated_at
  BEFORE UPDATE ON public.goal_proposals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_goal_proposals_individual_id ON public.goal_proposals(individual_id);
CREATE INDEX idx_goal_proposals_proposer_id ON public.goal_proposals(proposer_id);
CREATE INDEX idx_goal_proposals_status ON public.goal_proposals(status);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read_at ON public.notifications(read_at);