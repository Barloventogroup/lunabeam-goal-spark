# Invitation Flow Test Guide

## Complete End-to-End Flow

### 1. Admin sends invitation
- Admin clicks "Send Invitation" for user "nat"
- Modal generates claim token and creates account_claims record
- Email sent with link: `/auth?mode=claim&token=ABC123&email=cas1170@gmail.com`

### 2. User receives email and clicks link
- User is redirected to Auth page with claim mode
- UI shows: "Complete your account setup" with green notice
- Email field is pre-filled from URL parameter
- Claim token stored in sessionStorage

### 3. User creates account
- User enters password and clicks "Create Account"
- Supabase creates new auth.users record
- Code transfers data from provisional profile to real user:
  - Moves supporter relationships
  - Moves goals/steps
  - Deletes old provisional profile
  - Updates account claim status

### 4. User is redirected to dashboard
- Account is fully set up and linked
- All supporter relationships are preserved
- User can immediately start using the app

## Key Files Modified
- `src/components/lunebeam/assign-email-modal.tsx` - Generate claim tokens
- `src/pages/Auth.tsx` - Handle claim mode and account linking
- `supabase/functions/send-invitation-email/index.ts` - Send proper invite links

## Testing Steps
1. Log in as an admin
2. Go to Team tab
3. Find a "Not invited yet" user
4. Click "Send Invitation"
5. Check email for invitation link
6. Click link and verify it goes to signup with proper context
7. Create account and verify claim process works