-- Fix User Email and Personal Data Security Vulnerabilities
-- Replace potentially vulnerable policies with explicitly secure ones

-- DROP and recreate supporter_invites policies with explicit authentication checks
DROP POLICY IF EXISTS "Individuals can view their invites (limited)" ON public.supporter_invites;
DROP POLICY IF EXISTS "Inviters can create supporter invites" ON public.supporter_invites;
DROP POLICY IF EXISTS "Inviters can update their pending invites" ON public.supporter_invites;
DROP POLICY IF EXISTS "Inviters can view their sent invites (limited)" ON public.supporter_invites;

-- Secure policies that explicitly require authentication and handle edge cases
CREATE POLICY "Authenticated inviters can create invites"
ON public.supporter_invites
FOR INSERT
TO authenticated  -- Explicit role restriction
WITH CHECK (
  auth.uid() IS NOT NULL  -- Explicit null check
  AND inviter_id = auth.uid()
  AND individual_id != auth.uid()  -- Prevent self-invites
  AND individual_id IS NOT NULL    -- Prevent null individual_id
  AND expires_at > now()
);

CREATE POLICY "Authenticated inviters can view their sent invites"
ON public.supporter_invites
FOR SELECT
TO authenticated  -- Explicit role restriction
USING (
  auth.uid() IS NOT NULL  -- Explicit null check
  AND inviter_id = auth.uid()
  AND inviter_id IS NOT NULL  -- Prevent null matching
);

CREATE POLICY "Authenticated individuals can view their received invites"
ON public.supporter_invites
FOR SELECT
TO authenticated  -- Explicit role restriction  
USING (
  auth.uid() IS NOT NULL  -- Explicit null check
  AND individual_id = auth.uid()
  AND individual_id IS NOT NULL  -- Prevent null matching
);

CREATE POLICY "Authenticated inviters can update their pending invites"
ON public.supporter_invites
FOR UPDATE
TO authenticated  -- Explicit role restriction
USING (
  auth.uid() IS NOT NULL  -- Explicit null check
  AND inviter_id = auth.uid()
  AND inviter_id IS NOT NULL  -- Prevent null matching
  AND status = 'pending'
  AND expires_at > now()
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND inviter_id = auth.uid()
  AND status IN ('pending', 'declined', 'expired')
);

-- DROP and recreate profiles policies with explicit authentication checks
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;  
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Secure profiles policies with explicit authentication requirements
CREATE POLICY "Authenticated users can create their profile"
ON public.profiles
FOR INSERT
TO authenticated  -- Explicit role restriction
WITH CHECK (
  auth.uid() IS NOT NULL  -- Explicit null check
  AND user_id = auth.uid()
  AND user_id IS NOT NULL  -- Prevent null user_id
);

CREATE POLICY "Authenticated users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated  -- Explicit role restriction
USING (
  auth.uid() IS NOT NULL  -- Explicit null check
  AND user_id = auth.uid()
  AND user_id IS NOT NULL  -- Prevent null matching
);

CREATE POLICY "Authenticated users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated  -- Explicit role restriction
USING (
  auth.uid() IS NOT NULL  -- Explicit null check
  AND user_id = auth.uid()
  AND user_id IS NOT NULL  -- Prevent null matching
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
);

-- Add security documentation
COMMENT ON TABLE public.supporter_invites IS 
'Contains sensitive email addresses and invitation tokens. Access is strictly limited to:
- Authenticated inviters can manage their own sent invites
- Authenticated individuals can view invites sent to them
- All null values are explicitly rejected to prevent authentication bypasses
- Anonymous access is completely prohibited';

COMMENT ON TABLE public.profiles IS 
'Contains personal information including names and preferences. Access is strictly limited to:
- Authenticated users can only access their own profile data
- All null values are explicitly rejected to prevent authentication bypasses  
- Anonymous access is completely prohibited';