-- Family Circles and Invites System

-- Family Circles table
CREATE TABLE public.family_circles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'My Circle',
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Circle Memberships table  
CREATE TABLE public.circle_memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  circle_id UUID NOT NULL REFERENCES public.family_circles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('individual', 'parent_guide', 'cheerleader', 'coach')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'revoked')),
  share_scope JSONB NOT NULL DEFAULT '{
    "goals": true,
    "progress": true, 
    "checkins": false,
    "badges": true,
    "calendar": false,
    "notes": false,
    "reflections": false
  }'::jsonb,
  consent_log JSONB[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(circle_id, user_id)
);

-- Circle Invites table
CREATE TABLE public.circle_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  circle_id UUID NOT NULL REFERENCES public.family_circles(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_name TEXT,
  invitee_contact TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('individual', 'parent_guide', 'cheerleader', 'coach')),
  share_scope JSONB NOT NULL DEFAULT '{
    "goals": true,
    "progress": true,
    "checkins": false, 
    "badges": true,
    "calendar": false,
    "notes": false,
    "reflections": false
  }'::jsonb,
  message TEXT,
  delivery_method TEXT NOT NULL CHECK (delivery_method IN ('email', 'sms')),
  magic_token TEXT NOT NULL UNIQUE,
  parent_led_draft BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Weekly Check-ins table
CREATE TABLE public.weekly_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  circle_id UUID NOT NULL REFERENCES public.family_circles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_of DATE NOT NULL,
  wins JSONB[] NOT NULL DEFAULT '{}',
  microsteps JSONB[] NOT NULL DEFAULT '{}',
  reward JSONB,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(circle_id, user_id, week_of)
);

-- Enable RLS on all tables
ALTER TABLE public.family_circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_checkins ENABLE ROW LEVEL SECURITY;

-- RLS Policies for family_circles
CREATE POLICY "Users can view circles they own or are members of"
  ON public.family_circles FOR SELECT
  USING (
    owner_id = auth.uid() OR
    id IN (
      SELECT circle_id FROM public.circle_memberships 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can create their own circles"
  ON public.family_circles FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Circle owners can update their circles"
  ON public.family_circles FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Circle owners can delete their circles"
  ON public.family_circles FOR DELETE
  USING (owner_id = auth.uid());

-- RLS Policies for circle_memberships  
CREATE POLICY "Users can view memberships in their circles"
  ON public.circle_memberships FOR SELECT
  USING (
    user_id = auth.uid() OR
    circle_id IN (
      SELECT circle_id FROM public.circle_memberships 
      WHERE user_id = auth.uid() AND status = 'active'
    ) OR
    circle_id IN (
      SELECT id FROM public.family_circles WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Circle owners can manage memberships"
  ON public.circle_memberships FOR ALL
  USING (
    circle_id IN (
      SELECT id FROM public.family_circles WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own membership"
  ON public.circle_memberships FOR UPDATE
  USING (user_id = auth.uid());

-- RLS Policies for circle_invites
CREATE POLICY "Users can view invites they sent or received"
  ON public.circle_invites FOR SELECT
  USING (
    inviter_id = auth.uid() OR
    circle_id IN (
      SELECT id FROM public.family_circles WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Circle owners can create invites"
  ON public.circle_invites FOR INSERT
  WITH CHECK (
    circle_id IN (
      SELECT id FROM public.family_circles WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Circle owners can update invites"
  ON public.circle_invites FOR UPDATE
  USING (
    circle_id IN (
      SELECT id FROM public.family_circles WHERE owner_id = auth.uid()
    )
  );

-- RLS Policies for weekly_checkins
CREATE POLICY "Users can view checkins in their circles"
  ON public.weekly_checkins FOR SELECT
  USING (
    user_id = auth.uid() OR
    circle_id IN (
      SELECT circle_id FROM public.circle_memberships 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can create their own checkins"
  ON public.weekly_checkins FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own checkins"
  ON public.weekly_checkins FOR UPDATE
  USING (user_id = auth.uid());

-- Add updated_at trigger for all tables
CREATE TRIGGER update_family_circles_updated_at
  BEFORE UPDATE ON public.family_circles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_circle_memberships_updated_at
  BEFORE UPDATE ON public.circle_memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_circle_invites_updated_at
  BEFORE UPDATE ON public.circle_invites
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_weekly_checkins_updated_at
  BEFORE UPDATE ON public.weekly_checkins
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();