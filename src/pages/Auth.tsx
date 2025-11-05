import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/auth/auth-provider';
import { FirstTimePasswordSetup } from '@/components/auth/first-time-password-setup';
import { SupporterPasswordSetup } from '@/components/auth/supporter-password-setup';
import { getSupporterInviteByToken } from '@/utils/supporterUtils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/store/useStore';
import Lottie from 'lottie-react';
import loadingLunaAnimation from '@/assets/loading-luna-animation.json';
export default function Auth() {
  const {
    user,
    signIn,
    signUp,
    signOut
  } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
  const [needsPasswordSetup, setNeedsPasswordSetup] = useState(false);
  const [showSupporterSetup, setShowSupporterSetup] = useState(false);
  const [supporterSetupData, setSupporterSetupData] = useState<{token: string, individualName: string, inviteeEmail: string} | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [showLoginAnimation, setShowLoginAnimation] = useState(false);
  const pendingSignInRef = useRef(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

// Check for password setup mode and pre-fill email from URL parameter
useEffect(() => {
  const emailFromUrl = searchParams.get('email');
  const mode = searchParams.get('mode');
  const fromParam = searchParams.get('from');
  const token = searchParams.get('token');
  
  if (emailFromUrl) {
    setFormData(prev => ({
      ...prev,
      email: emailFromUrl
    }));
  }
  
  // Prioritize supporter setup to avoid generic token redirect
  if (mode === 'supporter-setup') {
    const supporterToken = token;
    if (supporterToken) {
      handleSupporterSetup(supporterToken);
      return;
    }
  }

  // Handle claim links explicitly
  if (mode === 'claim' && token) {
    // Redirect claim links to callback to process auto account creation (email optional)
    setSigningOut(true);
    const dest = emailFromUrl
      ? `/auth/callback?token=${token}&email=${encodeURIComponent(emailFromUrl)}`
      : `/auth/callback?token=${token}`;
    console.log('Auth: Detected claim token, redirecting to', dest);
    navigate(dest, { replace: true });
    return;
  }

  if (mode === 'setup') {
    console.log('Auth: Setup mode detected, showing password setup');
    setNeedsPasswordSetup(true);
    setShowPasswordSetup(true);
  }
}, [searchParams]);
  
  const isSupporterInvite = searchParams.get('redirect') === 'supporter-invite';

  // Redirect to dashboard after successful authentication
  useEffect(() => {
    if (user && !loading && !showPasswordSetup && !showSupporterSetup && !showLoginAnimation) {
      checkPasswordSetupNeeded();
    }
  }, [user, loading, navigate, showPasswordSetup, showSupporterSetup, showLoginAnimation]);
  const checkPasswordSetupNeeded = async () => {
    if (!user || showLoginAnimation) return;
    
    // Prevent redirect while supporter setup is active or when URL indicates supporter setup
    if (showSupporterSetup || searchParams.get('mode') === 'supporter-setup') {
      return;
    }
    
    // Check for mode=setup in URL
    const mode = searchParams.get('mode');
    if (mode === 'setup') {
      console.log('Auth: Setup mode in URL, showing password setup');
      setNeedsPasswordSetup(true);
      setShowPasswordSetup(true);
      return;
    }
    // Check for claim data from session storage
    const claimData = sessionStorage.getItem('claimData');
    if (claimData) {
      console.log('Auth: Claim data in session storage, showing password setup');
      setNeedsPasswordSetup(true);
      setShowPasswordSetup(true);
      return;
    }
    
    try {
      const {
        data: profile,
        error
      } = await supabase.from('profiles').select('password_set, authentication_status').eq('user_id', user.id).single();
      
      if (error) {
        console.error('Auth: Error checking profile:', error);
        navigate('/', { replace: true });
        return;
      }
      
      // Show password setup if password not set OR authentication status is pending
      if (!profile?.password_set || profile?.authentication_status === 'pending') {
        console.log('Auth: Profile needs password setup:', { password_set: profile?.password_set, authentication_status: profile?.authentication_status });
        setNeedsPasswordSetup(true);
        setShowPasswordSetup(true);
      } else {
        if (pendingSignInRef.current) {
          sessionStorage.setItem('sign-in-just-completed', 'true');
          pendingSignInRef.current = false;
          navigate('/', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      }
    } catch (error) {
      console.error('Error checking password setup:', error);
      navigate('/', {
        replace: true
      });
    }
  };
  const handlePasswordSetupComplete = () => {
    setShowPasswordSetup(false);
    setNeedsPasswordSetup(false);
    // Redirect to individual's home tab
    navigate('/', {
      replace: true
    });
  };

  const handleSupporterSetup = async (token: string) => {
    try {
      const inviteData = await getSupporterInviteByToken(token);
      if (inviteData) {
        setSupporterSetupData({
          token,
          individualName: inviteData.individual_name,
          inviteeEmail: inviteData.invitee_email
        });
        setShowSupporterSetup(true);
      } else {
        toast.error('Invalid or expired invitation link');
      }
    } catch (error) {
      console.error('Error processing supporter invitation:', error);
      toast.error('Failed to process invitation');
    }
  };

  const handleSupporterSetupComplete = async () => {
    setShowSupporterSetup(false);
    setSupporterSetupData(null);
    try {
      await useStore.getState().loadProfile();
    } catch (e) {
      console.warn('Auth: failed to refresh profile after supporter setup', e);
    }
    // Redirect to supporter dashboard
    navigate('/', { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Try signing in first
      pendingSignInRef.current = true;
      const { error: signInError } = await signIn(formData.email, formData.password);
      
      if (signInError) {
        pendingSignInRef.current = false;
        const msg = (signInError?.message || '').toLowerCase();
        
        // If user doesn't exist, try signing up
        if (msg.includes('invalid login') || msg.includes('invalid credentials') || msg.includes('user not found')) {
          const claimToken = sessionStorage.getItem('claimToken');
          const { error: signUpError } = await signUp(formData.email, formData.password, 'User');
          
          if (signUpError) {
            toast.error(signUpError.message);
          } else {
            if (claimToken) {
              toast.success('Account created! Please check your email to verify your account, then return to complete setup.');
            } else if (isSupporterInvite) {
              toast.success('Account created! You will be connected as a supporter after verification.');
            } else {
              toast.success('Account created! Please check your email to verify your account.');
            }
          }
        } else if (signInError?.status === 500 || msg.includes('database error querying schema') || msg.includes('unexpected_failure')) {
          // Fallback to magic link
          const redirectUrl = `${window.location.origin}/auth/callback`;
          const { error: otpError } = await supabase.auth.signInWithOtp({
            email: formData.email,
            options: {
              emailRedirectTo: redirectUrl
            }
          });
          if (!otpError) {
            toast.success('Magic link sent! Check your email to continue.');
          } else {
            toast.error(otpError.message || 'Failed to send magic link');
          }
        } else {
          toast.error(signInError.message);
        }
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };
  const handleSocialSignIn = async (provider: 'google' | 'facebook' | 'apple') => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          ...(provider === 'google' ? { flowType: 'pkce' as any } : {}),
          queryParams: provider === 'google' ? {
            access_type: 'offline',
            prompt: 'consent'
          } : undefined
        } as any
      });
      if (error) {
        toast.error(error.message || `${provider} sign-in failed`);
      }
    } catch (e) {
      toast.error(`${provider} sign-in failed`);
    } finally {
      setLoading(false);
    }
  };
  const handleMagicLink = async () => {
    if (!formData.email) {
      toast.error('Please enter your email first');
      return;
    }
    setLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/auth/callback`;
      const {
        error
      } = await supabase.auth.signInWithOtp({
        email: formData.email,
        options: {
          emailRedirectTo: redirectUrl
        }
      });
      if (error) {
        toast.error(error.message || 'Failed to send magic link');
      } else {
        toast.success('Magic link sent! Check your email to continue.');
      }
    } catch (e) {
      toast.error('Failed to send magic link');
    } finally {
      setLoading(false);
    }
  };

  // Show login animation
  if (showLoginAnimation) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <Lottie
            animationData={loadingLunaAnimation}
            loop={false}
            style={{ width: '150vmax', height: '150vmax' }}
          />
        </div>
      </div>
    );
  }

  // Show loading when signing out for claim
  if (signingOut) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center p-4" style={{
        backgroundImage: 'url(/lovable-uploads/9c1b5bdb-2b99-433d-8696-e539336f2074.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
        <Card className="w-full max-w-xs shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-sm text-muted-foreground">Preparing your account setup...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show supporter setup screen
  if (showSupporterSetup && supporterSetupData) {
    return (
      <SupporterPasswordSetup 
        onComplete={handleSupporterSetupComplete}
        supporterToken={supporterSetupData.token}
        individualName={supporterSetupData.individualName}
        inviteeEmail={supporterSetupData.inviteeEmail}
      />
    );
  }

  // Show password setup screen for first-time users or invited individuals
  if (showPasswordSetup && needsPasswordSetup) {
    return <FirstTimePasswordSetup onComplete={handlePasswordSetupComplete} />;
  }
  return <div 
    className="min-h-[100dvh] flex items-center justify-center overflow-y-auto" 
    style={{
      backgroundImage: 'url(/lovable-uploads/9c1b5bdb-2b99-433d-8696-e539336f2074.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      paddingTop: 'env(safe-area-inset-top, 0px)',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)'
    }}
  >
      <Card className="w-full max-w-xs shadow-2xl border-0 bg-white/95 backdrop-blur-sm my-4">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <img src="/lovable-uploads/7f6e5283-da38-4bfc-ac26-ae239e843b39.png" alt="Lunabeam logo" className="h-11 w-auto object-cover object-center" />
          </div>
          <CardDescription className="text-black font-bold">
            {isSupporterInvite ? "Join as a supporter" : 
             searchParams.get('mode') === 'claim' ? "Complete your account setup" :
             "Guiding big dreams, one step at a time."}
          </CardDescription>
          {user && <div className="mt-2 text-sm text-muted-foreground">
              You're currently signed in. 
              <Button variant="ghost" className="ml-1 px-2 py-0 h-6" onClick={async () => {
            await signOut();
          }}>
                Sign out to switch account
              </Button>
            </div>}
        </CardHeader>
        
        <CardContent>
          {isSupporterInvite && <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
              You've been invited to become a supporter. Continue to get started!
            </div>}
          {searchParams.get('mode') === 'claim' && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-800">
              You've been invited to join Lunabeam! Continue to get started with your goals.
            </div>}
          
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
              onClick={() => handleSocialSignIn('google')}
              disabled={loading}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </Button>
            
            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
              onClick={() => handleSocialSignIn('facebook')}
              disabled={loading}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Continue with Facebook
            </Button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-2">
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} required placeholder="Enter your email" className="border-gray-500 focus:border-primary text-base bg-white" />
            </div>
            
            <div className="space-y-2">
              <Input id="password" name="password" type="password" value={formData.password} onChange={handleInputChange} required placeholder="Enter your password" minLength={6} className="border-gray-500 focus:border-primary text-base bg-white" />
            </div>
            
            <div className="mb-6 -mt-2 text-center">
              <Link to="/auth/request-reset" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                Forgot your password?
              </Link>
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Loading...' : 'Continue'}
            </Button>
          </form>
          
          <p className="mt-4 text-center text-xs text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
          
          {/* Build marker for verification */}
          <div className="text-center mt-4">
            <p className="text-xs text-muted-foreground/50">Build: 2025-10-24 14:30 UTC</p>
          </div>
        </CardContent>
      </Card>
    </div>;
}