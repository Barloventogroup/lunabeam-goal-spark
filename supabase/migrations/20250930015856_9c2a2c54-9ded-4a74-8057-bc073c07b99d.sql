UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"first_name": "Natalia"}'::jsonb
WHERE id = '6edde18b-733e-4fbe-a6ba-06a95e0c8a46';