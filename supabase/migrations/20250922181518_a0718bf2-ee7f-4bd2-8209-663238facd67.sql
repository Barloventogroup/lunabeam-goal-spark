-- Enable RLS and add policies for supporter_invites so authenticated inviters can create and view their own invites

-- Enable Row Level Security (safe if already enabled)
ALTER TABLE public.supporter_invites ENABLE ROW LEVEL SECURITY;

-- Allow inviters to INSERT rows they create
CREATE POLICY "Inviter can create invites"
ON public.supporter_invites
FOR INSERT
WITH CHECK (inviter_id = auth.uid());

-- Allow inviters to SELECT their own invites
CREATE POLICY "Inviter can view their invites"
ON public.supporter_invites
FOR SELECT
USING (inviter_id = auth.uid());