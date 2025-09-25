-- Add pending_admin_approval to invite_status enum
ALTER TYPE invite_status ADD VALUE 'pending_admin_approval';

-- Add requires_approval boolean to supporter_invites
ALTER TABLE supporter_invites 
ADD COLUMN requires_approval BOOLEAN DEFAULT false;

-- Add requested_by field to track original requester
ALTER TABLE supporter_invites 
ADD COLUMN requested_by UUID REFERENCES auth.users(id);