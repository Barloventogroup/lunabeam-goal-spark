-- Just clean up the old invitation
DELETE FROM supporter_invites WHERE lower(trim(invitee_email)) = 'carlos@barloventogroup.co';