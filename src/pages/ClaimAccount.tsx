import React, { useState, useEffect } from 'react';
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
  const [loading, setLoading] = useState(false);
  const [claimInfo, setClaimInfo] = useState<any>(null);
  const [passcode, setPasscode] = useState('');

  useEffect(() => {
    if (claimToken) {
      loadClaimInfo();
    }
  }, [claimToken]);

  const loadClaimInfo = async () => {
    if (!claimToken) return;
    
    try {
      // First get the claim info
      const { data: claimData, error: claimError } = await supabase
        .from('account_claims')
        .select('first_name, expires_at, status, individual_id')
        .eq('claim_token', claimToken)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .single();

      if (claimError || !claimData) {
        toast.error('Invalid or expired claim link');
        return;
      }

      // Get the individual's email from profiles
      const { data: profileData } = await supabase
        .from('profiles')
        .select('email')
        .eq('user_id', claimData.individual_id)
        .single();

      const claimInfoWithEmail = {
        ...claimData,
        email: profileData?.email
      };

      setClaimInfo(claimInfoWithEmail);
      
      // Store claim info for login page
      if (profileData?.email) {
        localStorage.setItem('claim_info', JSON.stringify({
          email: profileData.email,
          firstName: claimData.first_name,
          claimToken
        }));
      }
    } catch (error) {
      console.error('Error loading claim info:', error);
      toast.error('Failed to load claim information');
    }
  };

  const handleClaim = async () => {
    if (!claimToken || !passcode) {
      toast.error('Please enter the passcode');
      return;
    }

    setLoading(true);
    try {
      // Call the edge function to handle the full claim process
      const { data, error } = await supabase.functions.invoke('claim-account-with-auth', {
        body: {
          claimToken,
          passcode: passcode.toUpperCase()
        }
      });

      if (error) {
        toast.error('Failed to claim account: ' + error.message);
        return;
      }

      if (data.success) {
        toast.success(`Welcome ${data.firstName}! Your account has been claimed.`);
        
        // If we have email and password, sign in directly
        if (data.email && data.password) {
          try {
            const { error: signInError } = await supabase.auth.signInWithPassword({
              email: data.email,
              password: data.password
            });
            
            if (signInError) {
              console.error('Sign in error:', signInError);
              // Fallback to session URL if available
              if (data.sessionUrl) {
                window.location.href = data.sessionUrl;
              } else {
                window.location.href = '/';
              }
            } else {
              // Successful sign in, redirect to dashboard
              window.location.href = '/';
            }
          } catch (error) {
            console.error('Sign in attempt failed:', error);
            window.location.href = '/';
          }
        } else if (data.sessionUrl) {
          window.location.href = data.sessionUrl;
        } else {
          // Clear claim info and redirect to dashboard
          localStorage.removeItem('claim_info');
          window.location.href = '/';
        }
      } else if (data.error === 'Account already claimed') {
        // Account is already claimed, redirect to login with pre-filled email
        const email = claimInfo.email;
        toast.info('This account is already claimed. Please sign in with your credentials.');
        navigate(`/auth?email=${encodeURIComponent(email || '')}`);
      } else {
        toast.error(data.error || 'Failed to claim account');
      }
    } catch (error) {
      console.error('Claim error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!claimInfo) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-6">
            <Loader2 className="w-6 h-6 animate-spin" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Claim Your Account</CardTitle>
          <p className="text-muted-foreground">
            Welcome {claimInfo.first_name}! Enter your passcode to access your account.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="passcode">Claim Passcode</Label>
            <Input
              id="passcode"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value.toUpperCase())}
              placeholder="Enter the passcode you received"
              className="uppercase text-center text-lg tracking-wider"
              maxLength={6}
            />
          </div>

          <Button 
            onClick={handleClaim} 
            className="w-full" 
            disabled={loading || !passcode}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Claiming Account...
              </>
            ) : (
              'Claim My Account'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}