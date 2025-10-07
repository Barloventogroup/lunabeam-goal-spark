import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface OnboardingRoleSelectionProps {
  onComplete: (data: { role: 'parent' | 'individual'; individualEmail?: string }) => void;
}

export function OnboardingRoleSelection({ onComplete }: OnboardingRoleSelectionProps) {
  const [role, setRole] = useState<'parent' | 'individual' | ''>('parent');
  const [individualEmail, setIndividualEmail] = useState('');
  const [showInterstitial, setShowInterstitial] = useState(false);

  const handleRoleSelection = (selectedRole: 'parent' | 'individual') => {
    setRole(selectedRole);
    // Advance immediately upon selection for both roles
    setShowInterstitial(true);
  };

  const handleParentContinue = () => {
    if (role === 'parent') {
      setShowInterstitial(true);
    }
  };

  const handleInterstitialNext = () => {
    onComplete({
      role: role as 'parent' | 'individual',
      individualEmail: role === 'parent' && individualEmail.trim() ? individualEmail.trim() : undefined
    });
  };

  const canParentContinue = true;

  // Show interstitial screen
  if (showInterstitial) {
    return (
      <div className="min-h-screen bg-gradient-soft">
        <Card className="shadow-none border-0 h-screen w-full rounded-none relative">
          <CardContent className="p-6 h-full flex flex-col items-center justify-center">
            <h1 className="text-xl font-medium text-black mb-8 text-center">
              The next questions will help me suggest goals and personalize your experience. Ready?
            </h1>
          </CardContent>
          <div className="absolute bottom-6 right-6">
            <Button onClick={handleInterstitialNext}>
              Next
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft">
        <Card className="shadow-none border-0 h-screen w-full rounded-none relative">
          <CardContent className="p-6 h-full flex flex-col overflow-y-auto">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-2">Welcome to Lunabeam</h1>
              <p className="text-black">
                Before we start, I need to know who's creating this account.
              </p>
            </div>

            <div className="space-y-4">
              <Label className="text-base font-semibold">Who is the main user for Lunebeam?</Label>
              <div className="space-y-3">
                <button
                  onClick={() => handleRoleSelection('individual')}
                  className="w-full p-4 border rounded-full hover:bg-muted/50 transition-colors text-left"
                >
                  <div>
                    <div className="font-semibold">Individual</div>
                    <div className="text-sm text-foreground-soft">I'm creating this account for myself</div>
                  </div>
                </button>
                <button
                  onClick={() => handleRoleSelection('parent')}
                  className="w-full p-4 border rounded-full hover:bg-muted/50 transition-colors text-left"
                >
                  <div>
                    <div className="font-semibold">Parent</div>
                    <div className="text-sm text-foreground-soft">I'm creating this account for my child</div>
                  </div>
                </button>
              </div>

            </div>
          </CardContent>
          
          {role === 'parent' && (
            <div className="absolute bottom-6 left-6 right-6 p-4 bg-muted/30 rounded-lg">
              <Label htmlFor="individual-email" className="text-sm font-semibold">
                Individual's Email Address
              </Label>
              <Input
                id="individual-email"
                type="email"
                placeholder="Enter your child's email address"
                value={individualEmail}
                onChange={(e) => setIndividualEmail(e.target.value)}
                className="mt-2"
              />
              <p className="text-xs text-foreground-soft mt-2">
                We'll send an email invitation for them to join Lunebeam.
              </p>
            </div>
          )}
          
          {role === 'parent' && (
            <div className="absolute bottom-6 right-6">
              <Button
                onClick={handleParentContinue}
                disabled={!canParentContinue}
              >
                Continue
              </Button>
            </div>
          )}
        </Card>
    </div>
  );
}