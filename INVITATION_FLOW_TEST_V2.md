# Fixed Invitation Flow Test Guide

## Complete End-to-End Flow (CORRECTED)

### 1. Admin sends invitation
- Admin clicks "Send Invitation" for user "nat"  
- Modal generates claim token and creates account_claims record
- Email sent with link: `/auth?mode=claim&token=ABC123&email=cas1170@gmail.com`

### 2. User receives email and clicks "Join Lunabeam" link
- User is redirected to Auth page with claim mode
- UI shows: "Complete your account setup" with green notice
- Email field is pre-filled from URL parameter
- Page shows signup form (not password setup yet)
- Claim token stored in sessionStorage

### 3. User creates account
- User enters password and clicks "Create Account"
- Supabase creates new auth.users record
- Toast shows: "Account created! Please check your email to verify your account."
- User switches to sign-in mode or waits for email

### 4. User verifies email (NEW STEP)
- User clicks verification link in email
- Gets redirected to AuthCallback
- AuthCallback processes verification and redirects to dashboard
- Auth provider detects claim token and triggers password setup

### 5. Password setup is triggered
- After email verification, checkPasswordSetupNeeded() runs
- Detects claim token in sessionStorage
- Shows FirstTimePasswordSetup component
- User sets their password

### 6. Account claim processing
- FirstTimePasswordSetup handles the claim:
  - Updates user password
  - Transfers supporter relationships from provisional to real user
  - Transfers goals/steps 
  - Deletes old provisional profile
  - Updates account claim status
  - Creates proper profile for new user

### 7. Final redirect
- User is redirected to individual's home dashboard (not admin's)
- All supporter relationships are preserved
- User can immediately start using the app

## Key Fixes Made

1. **Email link flow**: Now goes to signup first, then email verification, then password setup
2. **Email replacement**: User's verified email replaces temp email automatically
3. **Proper redirection**: After password setup, goes to individual's home tab
4. **UI clarity**: Better messaging throughout the process

## Testing Steps

1. Log in as an admin
2. Go to Team tab  
3. Find "nat" user (status should show "Not invited yet")
4. Click "Send Invitation"
5. Check email for invitation with "Join Lunabeam" button
6. Click the email link - should go to signup page with claim context
7. Create account with password
8. Check email for verification link
9. Click verification link
10. Should trigger password setup automatically
11. Set password and verify claim process completes
12. Verify user ends up on individual's home dashboard
13. Verify email has been updated to the real email address