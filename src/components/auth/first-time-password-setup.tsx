import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "./auth-provider";

interface FirstTimePasswordSetupProps {
  onComplete: () => void;
}

export const FirstTimePasswordSetup: React.FC<FirstTimePasswordSetupProps> = ({ onComplete }) => {
  const { user } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userLoading, setUserLoading] = useState(true);

  // Wait for user/session to be available without redirecting
  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const heartbeat = async () => {
      if (cancelled) return;
      const current = user || (await supabase.auth.getSession()).data.session?.user || null;
      if (current) {
        console.log('FirstTimePasswordSetup: session detected for', current.id);
        if (!cancelled) setUserLoading(false);
        return;
      }
      if (attempts < 24) {
        attempts += 1;
        setTimeout(heartbeat, 300);
      } else {
        console.warn('FirstTimePasswordSetup: session not found after waiting');
        if (!cancelled) setUserLoading(false);
      }
    };
    heartbeat();
    return () => { cancelled = true; };
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // Ensure we have a valid session
      let currentUser = user;
      if (!currentUser) {
        // Fallback: get user from current session
        const { data: { session } } = await supabase.auth.getSession();
        currentUser = session?.user || null;
        if (!currentUser) {
          throw new Error('No authenticated user found. Please try again.');
        }
      }

      console.log('Setting up password for user:', currentUser.id);

      // Update the user's password
      const { error: passwordError } = await supabase.auth.updateUser({
        password: password
      });

      if (passwordError) throw passwordError;

      // Update the user's profile to mark password as set
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          password_set: true,
          authentication_status: 'authenticated',
          account_status: 'active'
        })
        .eq('user_id', currentUser.id);

      if (profileError) {
        console.error('Failed to update profile:', profileError);
      } else {
        console.log('FirstTimePasswordSetup: profile updated for', currentUser.id);
      }
 
      // If this was a claim flow, mark the claim as accepted
      const claimData = sessionStorage.getItem('claimData');
      if (claimData) {
        const claimInfo = JSON.parse(claimData);
        
        // Update account claim status
        const { error: claimError } = await supabase
          .from('account_claims')
          .update({ 
            status: 'accepted',
            claimed_at: new Date().toISOString()
          })
          .eq('claim_token', claimInfo.token);

        if (claimError) {
          console.error('Failed to update claim status:', claimError);
        }

        // Clear claim data
        sessionStorage.removeItem('claimData');
        
        toast.success('Account claimed successfully! Welcome to Lunabeam.');
      } else {
        toast.success('Password set successfully! You can now log in with your email and password.');
      }
      
      onComplete();
    } catch (error: any) {
       console.error('Password setup failed:', error);
       toast.error(error.message || 'Failed to set password');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while waiting for user context
  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ 
      backgroundImage: 'url(/lovable-uploads/9c1b5bdb-2b99-433d-8696-e539336f2074.png)', 
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }}>
      <Card className="w-full max-w-md backdrop-blur-sm bg-white/95 border-0 shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Set Your Password</CardTitle>
          <p className="text-sm text-muted-foreground">
            Welcome! Please set a password for your account to complete setup.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  minLength={8}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters long
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
                minLength={8}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !password || !confirmPassword}
            >
              {loading ? 'Setting Password...' : 'Set Password & Continue'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};