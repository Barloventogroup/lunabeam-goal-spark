import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ClaimInfo {
  individual_id: string;
  first_name: string;
  invitee_email: string;
  status: string;
  provisioner_name?: string;
}

export default function ClaimAccount() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const claimToken = searchParams.get('token');
  
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimInfo, setClaimInfo] = useState<ClaimInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (claimToken) {
      loadClaimInfo();
    } else {
      setError('No claim token provided');
      setLoading(false);
    }
  }, [claimToken]);

  const loadClaimInfo = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('claim-lookup', {
        body: { 
          action: 'lookup',
          claim_token: claimToken 
        }
      });

      if (error) throw error;

      if (!data.valid) {
        setError(data.reason === 'expired' ? 'This invitation has expired.' : 'Invalid invitation link.');
        return;
      }

      setClaimInfo({
        individual_id: '',
        first_name: data.first_name,
        invitee_email: data.masked_email,
        status: 'pending'
      });
    } catch (error: any) {
      console.error('Failed to load claim info:', error);
      setError('Failed to load invitation details.');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimAccount = async () => {
    if (!claimToken || !password) return;

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      setClaiming(true);
      
      const { data, error } = await supabase.functions.invoke('claim-account-with-auth', {
        body: { 
          claimToken: claimToken,
          password: password
        }
      });

      if (error) throw error;

      if (data.success) {
        toast.success('Account claimed successfully! Please sign in with your new password.');
        navigate('/auth');
      } else {
        throw new Error(data.error || 'Failed to claim account');
      }

    } catch (error: any) {
      console.error('Failed to claim account:', error);
      toast.error(error.message || 'Failed to claim account');
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-primary/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading invitation details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !claimInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-primary/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Invalid Invitation</h2>
            <p className="text-muted-foreground mb-6">
              {error || 'This invitation link is invalid or has expired.'}
            </p>
            <Button onClick={() => navigate('/auth')} variant="outline" className="w-full">
              Go to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-primary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-xl">Claim Your Account</CardTitle>
          <p className="text-sm text-muted-foreground">
            Welcome {claimInfo.first_name}! Please create a password for your account.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Account for: {claimInfo.invitee_email}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Create Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter a password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            
            <Button 
              onClick={handleClaimAccount}
              disabled={claiming || !password || !confirmPassword}
              className="w-full"
              size="lg"
            >
              {claiming ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Claiming Account...
                </>
              ) : (
                'Claim Account'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}