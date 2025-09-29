-- Create notification for Carlos to approve Carlitos's supporter request
INSERT INTO notifications (
  user_id,
  type,
  title,
  message,
  data,
  created_at
) VALUES (
  '5c0c0ef9-b6ca-46b3-822b-1d4e847ed05c', -- Carlos (admin who should approve)
  'approval_request',
  'New Supporter Request',
  'Nat wants to invite Carlitos (carlos@barloventogroup.co) as a supporter',
  jsonb_build_object(
    'individual_id', '6edde18b-733e-4fbe-a6ba-06a95e0c8a46',
    'invitee_email', 'carlos@barloventogroup.co',
    'invitee_name', 'Carlitos',
    'requester_name', 'Nat'
  ),
  now()
);