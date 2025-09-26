-- Update Nat's profile to reflect successful account claim
UPDATE profiles 
SET 
  email = 'c_sandrea@yahoo.com',
  claimed_at = '2025-09-25 15:25:39.194+00',
  account_status = 'user_claimed',
  updated_at = now()
WHERE user_id = '6edde18b-733e-4fbe-a6ba-06a95e0c8a46';