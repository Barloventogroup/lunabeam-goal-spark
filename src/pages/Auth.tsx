import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/auth/auth-provider';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function Auth() {
  const { user, signIn, signUp, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // Pre-fill email for claimed individuals
  useEffect(() => {
    const emailFromUrl = searchParams.get('email');
    const claimInfo = localStorage.getItem('claim_info');
    
    if (emailFromUrl) {
      setFormData(prev => ({ ...prev, email: emailFromUrl }));
    } else if (claimInfo) {
      try {
        const { email } = JSON.parse(claimInfo);
        setFormData(prev => ({ ...prev, email }));
      } catch (e) {
        console.warn('Failed to parse claim info');
      }
    }
  }, [searchParams]);

  const isSupporterInvite = searchParams.get('redirect') === 'supporter-invite';
  const isClaimLogin = searchParams.get('email') || localStorage.getItem('claim_info');

  // Redirect to dashboard after successful authentication
  useEffect(() => {
    if (user && !loading) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

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
        const { error } = await signUp(formData.email, formData.password, 'User');
        if (error) {
          toast.error(error.message);
        } else {
          if (isSupporterInvite) {
            toast.success('Account created! You will be connected as a supporter after verification.');
          } else {
            toast.success('Account created! Please check your email to verify your account.');
          }
          setIsSignUp(false);
        }
      } else {
        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          const msg = (error?.message || '').toLowerCase();
          if (error?.status === 500 || msg.includes('database error querying schema') || msg.includes('unexpected_failure')) {
            const redirectUrl = `${window.location.origin}/auth/callback`;
            const { error: otpError } = await supabase.auth.signInWithOtp({
              email: formData.email,
              options: { emailRedirectTo: redirectUrl }
            });
            if (!otpError) {
              toast.success('Magic link sent! Check your email to continue.');
              localStorage.setItem('claim_info', JSON.stringify({ email: formData.email }));
            } else {
              toast.error(otpError.message || 'Failed to send magic link');
            }
          } else {
            toast.error(error.message);
          }
        } else {
          // Clear claim info on successful login
          localStorage.removeItem('claim_info');
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ 
      backgroundImage: 'url(/lovable-uploads/9c1b5bdb-2b99-433d-8696-e539336f2074.png)', 
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }}>
      <Card className="w-full max-w-xs shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <img 
              src="/lovable-uploads/7f6e5283-da38-4bfc-ac26-ae239e843b39.png" 
              alt="Lunabeam logo"
              className="h-11 w-auto object-cover object-center"
            />
          </div>
          <CardDescription className="text-black font-bold">
            {isSupporterInvite 
              ? "Create an account to become a supporter" 
              : isClaimLogin
              ? "Sign in to access your personalized dashboard"
              : "Guiding big dreams, one step at a time"
            }
          </CardDescription>
          {user && (
            <div className="mt-2 text-sm text-muted-foreground">
              You're currently signed in. 
              <Button variant="ghost" className="ml-1 px-2 py-0 h-6" onClick={async () => { await signOut(); }}>
                Sign out to switch account
              </Button>
            </div>
          )}
        </CardHeader>
        
        <CardContent>
          {isSupporterInvite && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
              You've been invited to become a supporter. Create an account to get started!
            </div>
          )}
          {!isSignUp && !isSupporterInvite && (
            <div className="mb-4 mt-10 text-sm text-black text-center">
              {isClaimLogin 
                ? "Enter your password to continue" 
                : "Sign in with your email to access your account"
              }
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-2">
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="Enter your email"
                className="border-gray-500 focus:border-primary text-sm bg-[#E0E0E0]"
              />
            </div>
            
            <div className="space-y-2">
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                placeholder="Enter your password"
                minLength={6}
                className="border-gray-500 focus:border-primary text-sm bg-[#E0E0E0]"
              />
            </div>
            
            {!isSignUp && (
              <div className="mb-6 -mt-2 text-center">
                <Link 
                  to="/auth/request-reset"
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  Forgot your password?
                </Link>
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? 'Loading...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            {!isSupporterInvite && (
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {isSignUp 
                  ? 'Already have an account? Sign in' 
                  : <>Don't have an account? Sign up</>
                }
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}