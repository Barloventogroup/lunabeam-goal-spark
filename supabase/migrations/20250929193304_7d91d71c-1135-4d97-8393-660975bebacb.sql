-- Clean up old invitation and create pending approval request for Carlitos
DELETE FROM supporter_invites WHERE lower(trim(invitee_email)) = 'carlos@barloventogroup.co';

-- Insert pending approval request that admin can approve through UI
INSERT INTO supporter_invites (
  individual_id,
  inviter_id,
  invitee_email,
  invitee_name,
  role,
  permission_level,
  status,
  expires_at,
  invite_token,
  message
) VALUES (
  '6edde18b-733e-4fbe-a6ba-06a95e0c8a46', -- Nat's individual_id
  '5c0c0ef9-b6ca-46b3-822b-1d4e847ed05c', -- Carlos as inviter
  'carlos@barloventogroup.co',
  'Carlitos',
  'supporter',
  'viewer',
  'pending_admin_approval',
  now() + interval '7 days',
  substring(replace((gen_random_uuid()::text || gen_random_uuid()::text), '-', '') from 1 for 24),
  'Request to join as supporter'
);