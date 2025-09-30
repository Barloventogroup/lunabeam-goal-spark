import React, { useState, useEffect } from 'react';
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
export default function Auth() {
  const {
    user,
    signIn,
    signUp,
    signOut
  } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
  const [needsPasswordSetup, setNeedsPasswordSetup] = useState(false);
  const [showSupporterSetup, setShowSupporterSetup] = useState(false);
  const [supporterSetupData, setSupporterSetupData] = useState<{token: string, individualName: string, inviteeEmail: string} | null>(null);
  const [signingOut, setSigningOut] = useState(false);
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
    setIsSignUp(false);
  } else if (mode === 'signup' && fromParam === 'invite') {
    setIsSignUp(true);
  } else if (mode === 'signin') {
    setIsSignUp(false);
  }
}, [searchParams]);
  
  const isSupporterInvite = searchParams.get('redirect') === 'supporter-invite';

  // Redirect to dashboard after successful authentication
  useEffect(() => {
    if (user && !loading && !showPasswordSetup && !showSupporterSetup) {
      checkPasswordSetupNeeded();
    }
  }, [user, loading, navigate, showPasswordSetup, showSupporterSetup]);
  const checkPasswordSetupNeeded = async () => {
    if (!user) return;
    
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
        navigate('/', {
          replace: true
        });
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

  // Auto-switch to signup mode for supporter invites
  useEffect(() => {
    if (isSupporterInvite && !isSignUp) {
      setIsSignUp(true);
    }
  }, [isSupporterInvite, isSignUp]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        // Check if this is an account claim process
        const claimToken = sessionStorage.getItem('claimToken');
        
        const {
          error
        } = await signUp(formData.email, formData.password, 'User');
        if (error) {
          toast.error(error.message);
        } else {
          // Check if this is an account claim process
          if (claimToken) {
            toast.success('Account created! Please check your email to verify your account, then return to complete setup.');
            setIsSignUp(false);
          } else if (isSupporterInvite) {
            toast.success('Account created! You will be connected as a supporter after verification.');
            setIsSignUp(false);
          } else {
            toast.success('Account created! Please check your email to verify your account.');
            setIsSignUp(false);
          }
        }
      } else {
        const {
          error
        } = await signIn(formData.email, formData.password);
        if (error) {
          const msg = (error?.message || '').toLowerCase();
          if (error?.status === 500 || msg.includes('database error querying schema') || msg.includes('unexpected_failure')) {
            const redirectUrl = `${window.location.origin}/auth/callback`;
            const {
              error: otpError
            } = await supabase.auth.signInWithOtp({
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
            toast.error(error.message);
          }
        } else {
          toast.success('Welcome back!');
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
  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const {
        error
      } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });
      if (error) {
        toast.error(error.message || 'Google sign-in failed');
      }
    } catch (e) {
      toast.error('Google sign-in failed');
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

  // Show loading when signing out for claim
  if (signingOut) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{
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
  return <div className="min-h-screen flex items-center justify-center p-4" style={{
    backgroundImage: 'url(/lovable-uploads/9c1b5bdb-2b99-433d-8696-e539336f2074.png)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  }}>
      <Card className="w-full max-w-xs shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <img src="/lovable-uploads/7f6e5283-da38-4bfc-ac26-ae239e843b39.png" alt="Lunabeam logo" className="h-11 w-auto object-cover object-center" />
          </div>
          <CardDescription className="text-black font-bold">
            {isSupporterInvite ? "Create an account to become a supporter" : 
             searchParams.get('mode') === 'claim' ? "Complete your account setup" :
             "Guiding big dreams, one step at a time"}
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
              You've been invited to become a supporter. Create an account to get started!
            </div>}
          {searchParams.get('mode') === 'claim' && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-800">
              You've been invited to join Lunabeam! Create your account to get started with your goals.
            </div>}
          {!isSignUp && !isSupporterInvite}
          <div className="space-y-3 mb-4">
            
            
            
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-2">
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} required placeholder="Enter your email" className="border-gray-500 focus:border-primary text-sm bg-[#E0E0E0]" />
            </div>
            
            <div className="space-y-2">
              <Input id="password" name="password" type="password" value={formData.password} onChange={handleInputChange} required placeholder="Enter your password" minLength={6} className="border-gray-500 focus:border-primary text-sm bg-[#E0E0E0]" />
            </div>
            
            {!isSignUp && <div className="mb-6 -mt-2 text-center">
                <Link to="/auth/request-reset" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                  Forgot your password?
                </Link>
              </div>}
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            {!isSupporterInvite && <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                {isSignUp ? 'Already have an account? Sign in' : <>Don't have an account? Sign up</>}
              </button>}
          </div>
        </CardContent>
      </Card>
    </div>;
}