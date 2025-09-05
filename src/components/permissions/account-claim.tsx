import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { PermissionsService, type AccountClaim } from '@/services/permissionsService';
import { useAuth } from '@/components/auth/auth-provider';
import { useNavigate } from 'react-router-dom';

interface AccountClaimProps {
  claimToken?: string;
}

export function AccountClaim({ claimToken: initialClaimToken }: AccountClaimProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [claimToken, setClaimToken] = useState(initialClaimToken || '');
  const [passcode, setPasscode] = useState('');
  const [claim, setClaim] = useState<AccountClaim | null>(null);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    if (claimToken) {
      loadClaimInfo();
    }
  }, [claimToken]);

  const loadClaimInfo = async () => {
    setLoading(true);
    try {
      const claimInfo = await PermissionsService.getAccountClaim(claimToken);
      setClaim(claimInfo);
      
      if (!claimInfo) {
        toast({
          title: "Invalid Claim",
          description: "This claim link is invalid or has expired",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Failed to load claim info:', error);
      toast({
        title: "Error",
        description: "Failed to load claim information",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClaimAccount = async () => {
    if (!claimToken || !passcode) {
      toast({
        title: "Missing Information",
        description: "Please enter both claim token and passcode",
        variant: "destructive"
      });
      return;
    }

    setClaiming(true);
    try {
      const success = await PermissionsService.claimAccount(claimToken, passcode);
      
      if (success) {
        setClaimed(true);
        toast({
          title: "Account Claimed Successfully!",
          description: "You now have full control of your account"
        });
        
        // Redirect to home after a brief delay
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        toast({
          title: "Claim Failed",
          description: "Invalid passcode or expired claim",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Failed to claim account:', error);
      toast({
        title: "Error",
        description: "Failed to claim account",
        variant: "destructive"
      });
    } finally {
      setClaiming(false);
    }
  };

  if (claimed) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-green-900">Account Claimed Successfully!</h3>
              <p className="text-sm text-green-700 mt-2">
                You now have full control of your account. Redirecting you to your dashboard...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Claim Your Account</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {claim && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Someone has created an account for you. Enter the passcode they provided to claim ownership.
            </AlertDescription>
          </Alert>
        )}

        <div>
          <Label htmlFor="claimToken">Claim Token</Label>
          <Input
            id="claimToken"
            value={claimToken}
            onChange={(e) => setClaimToken(e.target.value)}
            placeholder="Enter claim token from the link"
            disabled={!!initialClaimToken}
          />
        </div>

        <div>
          <Label htmlFor="passcode">Passcode</Label>
          <Input
            id="passcode"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value.toUpperCase())}
            placeholder="Enter 6-character passcode"
            maxLength={6}
          />
        </div>

        {claim && (
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Claim expires: {new Date(claim.expires_at).toLocaleDateString()}</p>
          </div>
        )}

        <div className="space-y-2">
          {!initialClaimToken && (
            <Button 
              onClick={loadClaimInfo} 
              disabled={!claimToken || loading}
              variant="outline"
              className="w-full"
            >
              {loading ? 'Validating...' : 'Validate Claim Token'}
            </Button>
          )}
          
          <Button 
            onClick={handleClaimAccount}
            disabled={!claimToken || !passcode || claiming || !claim}
            className="w-full"
          >
            {claiming ? 'Claiming Account...' : 'Claim Account'}
          </Button>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>
            Need help? Contact the person who created your account or{' '}
            <button className="text-primary hover:underline">
              contact support
            </button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}