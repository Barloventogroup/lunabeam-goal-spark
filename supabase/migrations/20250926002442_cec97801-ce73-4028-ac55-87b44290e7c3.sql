-- Delete the orphaned temporary Nat user that has no goals or supporter relationships
DELETE FROM profiles WHERE user_id = 'feeb665f-d13d-49f1-a055-91d520e5f462';
DELETE FROM auth.users WHERE id = 'feeb665f-d13d-49f1-a055-91d520e5f462';