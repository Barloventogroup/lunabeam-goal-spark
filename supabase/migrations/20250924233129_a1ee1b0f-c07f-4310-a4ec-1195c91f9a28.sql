-- Add claim_passcode column to account_claims table
ALTER TABLE public.account_claims 
ADD COLUMN claim_passcode text;