-- Create enum types for roles and permission levels
CREATE TYPE public.user_role AS ENUM ('individual', 'supporter', 'friend', 'provider', 'admin');
CREATE TYPE public.permission_level AS ENUM ('viewer', 'collaborator', 'admin');
CREATE TYPE public.account_status AS ENUM ('active', 'pending_user_consent', 'user_claimed');
CREATE TYPE public.invite_status AS ENUM ('pending', 'accepted', 'declined', 'expired');

-- Create supporters table to track all types of supporters
CREATE TABLE public.supporters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  individual_id UUID NOT NULL, -- The individual being supported
  supporter_id UUID NOT NULL, -- The supporter's user account
  role user_role NOT NULL DEFAULT 'supporter',
  permission_level permission_level NOT NULL DEFAULT 'viewer',
  specific_goals UUID[] DEFAULT '{}', -- For friends with goal-specific access
  is_provisioner BOOLEAN NOT NULL DEFAULT false, -- Temporary extra powers for on-behalf creators
  invited_by UUID, -- Who invited this supporter
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(individual_id, supporter_id)
);

-- Create account claims table for on-behalf account creation
CREATE TABLE public.account_claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  individual_id UUID NOT NULL, -- The account created on behalf of someone
  provisioner_id UUID NOT NULL, -- Who created the account
  claim_passcode TEXT NOT NULL,
  claim_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 days'),
  claimed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status invite_status NOT NULL DEFAULT 'pending'
);

-- Add account status and metadata to profiles
ALTER TABLE public.profiles 
ADD COLUMN account_status account_status NOT NULL DEFAULT 'active',
ADD COLUMN created_by_supporter UUID,
ADD COLUMN claimed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN guardian_locked_until DATE; -- For minors, supporters locked as admin until this date

-- Create supporter invites table
CREATE TABLE public.supporter_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  individual_id UUID NOT NULL,
  inviter_id UUID NOT NULL,
  invitee_email TEXT NOT NULL,
  invitee_name TEXT,
  role user_role NOT NULL,
  permission_level permission_level NOT NULL,
  specific_goals UUID[] DEFAULT '{}',
  invite_token TEXT NOT NULL UNIQUE,
  message TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status invite_status NOT NULL DEFAULT 'pending'
);

-- Enable RLS on all new tables
ALTER TABLE public.supporters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supporter_invites ENABLE ROW LEVEL SECURITY;

-- RLS policies for supporters table
CREATE POLICY "Individuals can view their supporters" 
ON public.supporters FOR SELECT 
USING (individual_id = auth.uid());

CREATE POLICY "Supporters can view their relationships" 
ON public.supporters FOR SELECT 
USING (supporter_id = auth.uid());

CREATE POLICY "Individuals can manage their supporters" 
ON public.supporters FOR ALL 
USING (individual_id = auth.uid());

CREATE POLICY "Provisioners can update during setup" 
ON public.supporters FOR UPDATE 
USING (supporter_id = auth.uid() AND is_provisioner = true);

-- RLS policies for account claims
CREATE POLICY "Provisioners can view their claims" 
ON public.account_claims FOR SELECT 
USING (provisioner_id = auth.uid());

CREATE POLICY "Individuals can view claims for their account" 
ON public.account_claims FOR SELECT 
USING (individual_id = auth.uid());

CREATE POLICY "Provisioners can create claims" 
ON public.account_claims FOR INSERT 
WITH CHECK (provisioner_id = auth.uid());

CREATE POLICY "Anyone can update claims during claiming process" 
ON public.account_claims FOR UPDATE 
USING (true); -- Controlled by claim token validation

-- RLS policies for supporter invites
CREATE POLICY "Individuals can manage their invites" 
ON public.supporter_invites FOR ALL 
USING (individual_id = auth.uid());

CREATE POLICY "Inviters can view their sent invites" 
ON public.supporter_invites FOR SELECT 
USING (inviter_id = auth.uid());

-- Create function to check user permissions
CREATE OR REPLACE FUNCTION public.check_user_permission(
  _individual_id UUID,
  _action TEXT,
  _goal_id UUID DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current_user_id UUID := auth.uid();
  _user_role user_role;
  _permission_level permission_level;
  _is_provisioner BOOLEAN;
  _account_status account_status;
BEGIN
  -- Check if user is the individual themselves
  IF _current_user_id = _individual_id THEN
    RETURN true;
  END IF;
  
  -- Get individual's account status
  SELECT account_status INTO _account_status 
  FROM profiles WHERE user_id = _individual_id;
  
  -- Get supporter relationship
  SELECT role, permission_level, is_provisioner 
  INTO _user_role, _permission_level, _is_provisioner
  FROM supporters 
  WHERE individual_id = _individual_id AND supporter_id = _current_user_id;
  
  -- If no relationship found, deny access
  IF _user_role IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check specific permissions based on action and role
  CASE _action
    WHEN 'view_goals' THEN
      RETURN _permission_level IN ('viewer', 'collaborator', 'admin') OR 
             (_user_role = 'friend' AND _goal_id = ANY(SELECT unnest(specific_goals) FROM supporters WHERE individual_id = _individual_id AND supporter_id = _current_user_id));
    
    WHEN 'create_goals', 'delete_goals' THEN
      RETURN _permission_level = 'admin' OR _is_provisioner;
    
    WHEN 'edit_goals', 'add_steps', 'mark_complete' THEN
      RETURN _permission_level IN ('collaborator', 'admin') OR _is_provisioner;
    
    WHEN 'edit_profile' THEN
      RETURN _permission_level = 'admin' OR _is_provisioner;
    
    WHEN 'manage_supporters' THEN
      RETURN _permission_level = 'admin' AND _user_role = 'supporter';
    
    ELSE
      RETURN false;
  END CASE;
END;
$$;

-- Create function to handle account claiming
CREATE OR REPLACE FUNCTION public.claim_account(
  _claim_token TEXT,
  _passcode TEXT
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _claim_record RECORD;
  _result JSON;
BEGIN
  -- Find and validate claim
  SELECT * INTO _claim_record
  FROM account_claims 
  WHERE claim_token = _claim_token 
    AND claim_passcode = _passcode
    AND status = 'pending'
    AND expires_at > now();
  
  IF _claim_record IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or expired claim');
  END IF;
  
  -- Update account claim status
  UPDATE account_claims 
  SET status = 'accepted', claimed_at = now()
  WHERE id = _claim_record.id;
  
  -- Update profile status
  UPDATE profiles 
  SET account_status = 'user_claimed', claimed_at = now()
  WHERE user_id = _claim_record.individual_id;
  
  -- Remove provisioner status from the supporter
  UPDATE supporters 
  SET is_provisioner = false
  WHERE individual_id = _claim_record.individual_id 
    AND supporter_id = _claim_record.provisioner_id;
  
  RETURN json_build_object('success', true, 'individual_id', _claim_record.individual_id);
END;
$$;

-- Create trigger to update timestamps
CREATE TRIGGER update_supporters_updated_at
  BEFORE UPDATE ON public.supporters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_supporters_individual_id ON public.supporters(individual_id);
CREATE INDEX idx_supporters_supporter_id ON public.supporters(supporter_id);
CREATE INDEX idx_account_claims_token ON public.account_claims(claim_token);
CREATE INDEX idx_supporter_invites_token ON public.supporter_invites(invite_token);