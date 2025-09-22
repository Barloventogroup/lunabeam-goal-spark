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
  const [password, setPassword] = useState('');

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

      setClaimInfo(claimData);
    } catch (error) {
      console.error('Error loading claim info:', error);
      toast.error('Failed to load claim information');
    }
  };

  const handleClaim = async () => {
    if (!claimToken || !passcode || !password) {
      toast.error('Please enter both the passcode and create a password');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      // Call the edge function to handle the full claim process
      const { data, error } = await supabase.functions.invoke('claim-account-with-auth', {
        body: {
          claimToken,
          passcode: passcode.toUpperCase(),
          password
        }
      });

      if (error) {
        toast.error('Failed to claim account: ' + error.message);
        return;
      }

      if (data.success) {
        toast.success(`Welcome ${data.firstName}! Your account has been claimed.`);
        
        // Sign in with the credentials we just created
        console.log('Attempting sign in with email:', data.email);
        if (data.email && password) {
          try {
            const { error: signInError } = await supabase.auth.signInWithPassword({
              email: data.email,
              password: password
            });
            
            console.log('Sign in result:', signInError);
            
            if (signInError) {
              console.error('Sign in error:', signInError);
              toast.error('Account claimed but sign in failed: ' + signInError.message);
              navigate(`/auth?email=${encodeURIComponent(data.email)}`);
            } else {
              console.log('Sign in successful, redirecting to dashboard');
              // Successful sign in, redirect to dashboard
              window.location.href = '/';
            }
          } catch (error) {
            console.error('Sign in attempt failed:', error);
            toast.error('Account claimed but sign in failed. Please try signing in manually.');
            navigate(`/auth?email=${encodeURIComponent(data.email)}`);
          }
        } else {
          console.log('Missing email or password for sign in');
          // Fallback redirect
          window.location.href = '/';
        }
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
    <div className="min-h-screen flex items-center justify-center p-4" style={{ 
      backgroundImage: 'url(/lovable-uploads/9c1b5bdb-2b99-433d-8696-e539336f2074.png)', 
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }}>
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-6">
            <Loader2 className="w-6 h-6 animate-spin" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ 
        backgroundImage: 'url(/lovable-uploads/9c1b5bdb-2b99-433d-8696-e539336f2074.png)', 
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Claim Your Account</CardTitle>
          <p className="text-muted-foreground">
            Welcome {claimInfo.first_name}! Enter your passcode and create a password to access your account.
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

          <div>
            <Label htmlFor="password">Create Your Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a secure password (min 6 characters)"
              minLength={6}
            />
          </div>

          <Button 
            onClick={handleClaim} 
            className="w-full" 
            disabled={loading || !passcode || !password}
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