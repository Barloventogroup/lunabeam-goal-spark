import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export function ClaimAccount() {
  const { claimToken } = useParams<{ claimToken: string }>();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    passcode: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleAuth = async () => {
    if (!claimToken || !formData.passcode) {
      toast.error('Claim token and passcode are required');
      return;
    }

    setLoading(true);
    try {
      let authResult;
      
      if (isSignUp) {
        // Sign up new user
        authResult = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              first_name: formData.firstName
            },
            emailRedirectTo: `${window.location.origin}/`
          }
        });
      } else {
        // Sign in existing user
        authResult = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });
      }

      if (authResult.error) {
        toast.error(authResult.error.message);
        return;
      }

      // Wait a moment for auth to settle
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Now claim the account
      const claimResult = await supabase.rpc('claim_account', {
        _claim_token: claimToken,
        _passcode: formData.passcode
      });

      if (claimResult.error) {
        toast.error('Failed to claim account: ' + claimResult.error.message);
        return;
      }

      const result = claimResult.data as { success: boolean; error?: string; individual_id?: string };
      if (result?.success) {
        toast.success('Account claimed successfully! Welcome to your dashboard.');
        navigate('/');
      } else {
        toast.error(result?.error || 'Failed to claim account');
      }
    } catch (error) {
      console.error('Auth/claim error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Claim Your Account</CardTitle>
          <p className="text-muted-foreground">
            {isSignUp ? 'Create your account to get started' : 'Sign in to claim your account'}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={isSignUp ? "default" : "outline"}
              onClick={() => setIsSignUp(true)}
              className="flex-1"
            >
              Sign Up
            </Button>
            <Button
              variant={!isSignUp ? "default" : "outline"}
              onClick={() => setIsSignUp(false)}
              className="flex-1"
            >
              Sign In
            </Button>
          </div>

          <div className="space-y-4">
            {isSignUp && (
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="Enter your first name"
                />
              </div>
            )}
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
              />
            </div>
            
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
              />
            </div>
            
            <div>
              <Label htmlFor="passcode">Claim Passcode</Label>
              <Input
                id="passcode"
                name="passcode"
                value={formData.passcode}
                onChange={handleInputChange}
                placeholder="Enter the passcode you received"
                className="uppercase"
              />
            </div>
          </div>

          <Button 
            onClick={handleAuth} 
            className="w-full" 
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isSignUp ? 'Creating Account...' : 'Signing In...'}
              </>
            ) : (
              `${isSignUp ? 'Sign Up' : 'Sign In'} & Claim Account`
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}