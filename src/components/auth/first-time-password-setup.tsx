import React, { useState } from 'react';
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
      // Check for claim token to handle account claiming flow
      const claimToken = sessionStorage.getItem('claimToken');
      const claimEmail = sessionStorage.getItem('claimEmail');
      
      if (claimToken) {
        // This is an account claim - need to handle the full claim process
        console.log('Processing account claim with token:', claimToken);
        
        // First ensure we have a valid session
        if (!user) {
          throw new Error('No authenticated user found. Please try again.');
        }
        
        // Update user password
        const { error: passwordError } = await supabase.auth.updateUser({
          password: password,
          email: claimEmail || user.email // Ensure email is properly set
        });

        if (passwordError) throw passwordError;

        // Get the claim details to transfer data
        const { data: claimData, error: claimError } = await supabase
          .from('account_claims')
          .select('individual_id, first_name, provisioner_id')
          .eq('claim_token', claimToken)
          .eq('status', 'pending')
          .single();

        if (claimError || !claimData) {
          throw new Error('Invalid or expired claim token');
        }

        // Transfer supporter relationships from provisional account to real user
        await supabase
          .from('supporters')
          .update({ individual_id: user?.id })
          .eq('individual_id', claimData.individual_id);

        // Transfer goals and related data
        await supabase
          .from('goals')
          .update({ owner_id: user?.id })
          .eq('owner_id', claimData.individual_id);

        // Delete the old provisional profile
        await supabase
          .from('profiles')
          .delete()
          .eq('user_id', claimData.individual_id);

        // Update the account claim status
        await supabase
          .from('account_claims')
          .update({
            status: 'accepted',
            claimed_at: new Date().toISOString(),
            individual_id: user?.id
          })
          .eq('claim_token', claimToken);

        // Create/update the profile for the claiming user
        await supabase
          .from('profiles')
          .upsert({
            user_id: user?.id,
            first_name: claimData.first_name || 'User',
            email: user?.email,
            user_type: 'individual',
            account_status: 'active',
            authentication_status: 'active',
            password_set: true,
            onboarding_complete: false,
            comm_pref: 'text'
          });

        // Clean up session storage
        sessionStorage.removeItem('claimToken');
        sessionStorage.removeItem('claimEmail');
        
        toast.success('Account claimed successfully! Welcome to Lunabeam.');
      } else {
        // Regular password setup flow
        const { error: passwordError } = await supabase.auth.updateUser({
          password: password
        });

        if (passwordError) throw passwordError;

        // Mark password as set in profile
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            password_set: true,
            authentication_status: 'active'
          })
          .eq('user_id', user?.id);

        if (profileError) throw profileError;
        
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