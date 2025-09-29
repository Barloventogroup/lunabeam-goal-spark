import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Eye, EyeOff, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "./auth-provider";

interface SupporterPasswordSetupProps {
  onComplete: () => void;
  supporterToken?: string;
  individualName?: string;
  inviteeEmail?: string;
}

export const SupporterPasswordSetup: React.FC<SupporterPasswordSetupProps> = ({ 
  onComplete, 
  supporterToken,
  individualName,
  inviteeEmail 
}) => {
  const { user } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userLoading, setUserLoading] = useState(false);

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

    if (!inviteeEmail) {
      toast.error('No email found in invitation');
      return;
    }

    setLoading(true);
    try {
      let currentUser = user;
      
      // If no current user, try to create an account or sign in
      if (!currentUser) {
        console.log('No current user, attempting to create account for:', inviteeEmail);
        
        // Try to sign up first (in case they don't have an account)
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: inviteeEmail,
          password: password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth?mode=supporter-setup&token=${supporterToken}`
          }
        });

        if (signUpError) {
          // If sign up fails (e.g., user exists), try to sign in
          if (signUpError.message?.includes('already registered') || signUpError.message?.includes('User already registered')) {
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email: inviteeEmail,
              password: password
            });

            if (signInError) {
              throw new Error('Failed to sign in with provided credentials. Please check your password or try creating a new account.');
            }
            currentUser = signInData.user;
          } else {
            throw signUpError;
          }
        } else {
          currentUser = signUpData.user;
        }
      }

      if (!currentUser) {
        throw new Error('Unable to authenticate. Please try again.');
      }

      console.log('Setting up password for supporter:', currentUser.id);

      // Update the user's password (in case they signed in with an old password)
      const { error: passwordError } = await supabase.auth.updateUser({
        password: password
      });

      if (passwordError) {
        console.error('Password update error:', passwordError);
        // Don't throw here as the user is already authenticated
      }

      // Update profile to mark password as set and complete supporter setup
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
      }

      // If we have a supporter token, mark the invitation as accepted
      if (supporterToken) {
        const { error: inviteError } = await supabase
          .from('supporter_invites')
          .update({ 
            status: 'accepted'
          })
          .eq('supporter_setup_token', supporterToken);

        if (inviteError) {
          console.error('Failed to update invitation status:', inviteError);
        }
      }

      toast.success(`Welcome to the support team${individualName ? ` for ${individualName}` : ''}!`);
      onComplete();
      
    } catch (error: any) {
       console.error('Supporter password setup failed:', error);
       toast.error(error.message || 'Failed to set password');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while processing
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
            <Users className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Join Support Team</CardTitle>
          <p className="text-sm text-muted-foreground">
            {individualName 
              ? `Set your password to become ${individualName}'s supporter`
              : 'Set your password to join as a supporter'
            }
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
              {loading ? 'Setting Password...' : 'Complete Setup & Join Team'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};