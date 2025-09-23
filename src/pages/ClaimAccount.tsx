import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, CheckCircle, AlertCircle } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimInfo, setClaimInfo] = useState<ClaimInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const claimToken = searchParams.get('token');

  useEffect(() => {
    if (claimToken) {
      loadClaimInfo();
    } else {
      setError('No claim token provided');
      setLoading(false);
    }
  }, [claimToken]);

  const loadClaimInfo = async () => {
    if (!claimToken) return;

    try {
      const { data, error } = await supabase
        .from('account_claims')
        .select(`
          individual_id,
          first_name,
          invitee_email,
          status,
          expires_at,
          magic_link_expires_at,
          profiles!provisioner_id(first_name)
        `)
        .eq('claim_token', claimToken)
        .eq('status', 'pending')
        .gt('magic_link_expires_at', new Date().toISOString())
        .single();

      if (error) {
        setError('This invitation link has expired or is invalid.');
        return;
      }

      setClaimInfo({
        ...data,
        provisioner_name: (data.profiles as any)?.first_name || 'Someone'
      });
    } catch (err: any) {
      setError('Failed to load invitation details.');
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLinkSignIn = async () => {
    if (!claimInfo) return;

    try {
      setClaiming(true);
      
      const { error } = await supabase.auth.signInWithOtp({
        email: claimInfo.invitee_email,
        options: {
          emailRedirectTo: `${window.location.origin}/claim-complete?token=${claimToken}`
        }
      });

      if (error) throw error;

      toast.success(`Magic link sent to ${claimInfo.invitee_email}! Check your email to complete setup.`);
      
    } catch (error: any) {
      toast.error(error.message || 'Failed to send magic link');
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
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => navigate('/auth')} variant="outline">
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
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-xl">Accept Invitation</CardTitle>
          <p className="text-sm text-muted-foreground">
            {claimInfo.provisioner_name} has set up a LunaBeam account for you
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-medium mb-2">Account Details</h3>
            <div className="space-y-1 text-sm">
              <p><span className="text-muted-foreground">Name:</span> {claimInfo.first_name}</p>
              <p><span className="text-muted-foreground">Email:</span> {claimInfo.invitee_email}</p>
            </div>
          </div>

          <Button 
            onClick={handleMagicLinkSignIn}
            disabled={claiming}
            className="w-full"
            size="lg"
          >
            {claiming ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending magic link...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Get Started - Send Magic Link
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}