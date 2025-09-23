import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function ClaimComplete() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const claimToken = searchParams.get('token');

  useEffect(() => {
    if (user && claimToken) {
      handleAccountClaim();
    } else if (!claimToken) {
      setError('No claim token provided');
      setLoading(false);
    }
  }, [user, claimToken]);

  const handleAccountClaim = async () => {
    if (!user || !claimToken) return;

    try {
      setClaiming(true);
      
      // Check if claim is valid and get details
      const { data: claimData, error: claimError } = await supabase
        .from('account_claims')
        .select('individual_id, first_name, status, magic_link_expires_at')
        .eq('claim_token', claimToken)
        .eq('status', 'pending')
        .gt('magic_link_expires_at', new Date().toISOString())
        .single();

      if (claimError) {
        setError('This invitation link has expired or is invalid.');
        return;
      }

      // Update the account claim to accepted and bind to current user
      const { error: updateError } = await supabase
        .from('account_claims')
        .update({
          status: 'accepted',
          claimed_at: new Date().toISOString(),
          individual_id: user.id
        })
        .eq('claim_token', claimToken);

      if (updateError) {
        throw updateError;
      }

      // Update any supporter relationships to point to the real user
      const { error: supporterError } = await supabase
        .from('supporters')
        .update({ individual_id: user.id })
        .eq('individual_id', claimData.individual_id);

      if (supporterError) {
        console.warn('Warning: Failed to update supporter relationships:', supporterError);
      }

      // Update the user's profile to reflect claimed status
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          account_status: 'user_claimed',
          claimed_at: new Date().toISOString(),
          authentication_status: 'active',
          password_set: false
        })
        .eq('user_id', user.id);

      if (profileError) {
        throw profileError;
      }

      setClaimed(true);
      toast.success('Account successfully claimed! Welcome to LunaBeam.');

    } catch (error: any) {
      console.error('Failed to claim account:', error);
      setError(error.message || 'Failed to claim account');
      toast.error('Failed to claim account');
    } finally {
      setLoading(false);
      setClaiming(false);
    }
  };

  const handleContinue = () => {
    navigate('/');
  };

  if (loading || claiming) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-primary/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">
              {claiming ? 'Setting up your account...' : 'Loading...'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-primary/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Setup Failed</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => navigate('/auth')} variant="outline">
              Go to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (claimed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-primary/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-xl text-green-600">Account Claimed Successfully!</CardTitle>
            <p className="text-sm text-muted-foreground">
              Welcome to LunaBeam! Your account has been set up and is ready to use.
            </p>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium text-green-800 mb-2">What's next?</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Explore your dashboard and goals</li>
                <li>• Connect with your support team</li>
                <li>• Start tracking your achievements</li>
                <li>• Earn points for completing goals</li>
              </ul>
            </div>

            <Button 
              onClick={handleContinue}
              className="w-full"
              size="lg"
            >
              Get Started
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}