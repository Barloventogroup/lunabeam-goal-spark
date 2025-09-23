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
    if (selectedRole === 'individual') {
      setShowInterstitial(true);
    }
  };

  const handleParentContinue = () => {
    if (role === 'parent') {
      setShowInterstitial(true);
    }
  };

  const handleInterstitialNext = () => {
    onComplete({
      role: role as 'parent' | 'individual',
      individualEmail: role === 'parent' ? individualEmail : undefined
    });
  };

  const canParentContinue = true;

  // Show interstitial screen
  if (showInterstitial) {
    return (
      <div className="min-h-screen bg-gradient-soft p-4 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-xl font-medium text-black mb-8">
            The next questions will help me suggest goals and personalize your experience. Ready?
          </h1>
          <Button
            onClick={handleInterstitialNext}
            className="w-full"
          >
            Next
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft p-4">
      <div className="max-w-md mx-auto py-8">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-foreground-soft">Step 1 of 2</span>
            <span className="text-sm text-foreground-soft">50%</span>
          </div>
          <div className="w-full bg-border rounded-full h-2">
            <div 
              className="bg-gradient-primary h-2 rounded-full transition-all duration-500" 
              style={{ width: '50%' }}
            />
          </div>
        </div>

        <Card className="p-6 shadow-card border-0">
          <CardContent className="p-0 space-y-6">
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

              {role === 'parent' && (
                <div className="space-y-2 mt-4 p-4 bg-muted/30 rounded-lg">
                  <Label htmlFor="individual-email" className="text-sm font-semibold">
                    Individual's Email Address
                  </Label>
                  <Input
                    id="individual-email"
                    type="email"
                    placeholder="Enter your child's email address"
                    value={individualEmail}
                    onChange={(e) => setIndividualEmail(e.target.value)}
                  />
                  <p className="text-xs text-foreground-soft">
                    We'll send an email invitation for them to join Lunebeam.
                  </p>
                  <Button
                    onClick={handleParentContinue}
                    disabled={!canParentContinue}
                    className="w-full mt-4"
                  >
                    Continue
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}