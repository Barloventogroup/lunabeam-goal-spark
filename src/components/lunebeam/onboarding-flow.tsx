import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingConversation } from './onboarding-conversation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

export function OnboardingFlow() {
  const navigate = useNavigate();
  const [roleData, setRoleData] = useState<{ role: 'parent' | 'individual' | ''; individualEmail?: string }>({ role: '' });
  const [showRoleSelection, setShowRoleSelection] = useState(true);
  const [showInterstitial, setShowInterstitial] = useState(false);

  const handleRoleSelection = (role: 'parent' | 'individual') => {
    setRoleData({ role });
    setShowInterstitial(true);
  };

  const handleInterstitialNext = () => {
    setShowRoleSelection(false);
    setShowInterstitial(false);
  };

  const handleOnboardingComplete = () => {
    navigate('/');
  };

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

  if (showRoleSelection) {
    return (
      <div className="min-h-screen bg-gradient-primary p-4 flex items-center justify-center">
        <Card className="w-full max-w-md shadow-card border-0">
          <CardHeader className="text-left">
            <CardTitle className="text-2xl">Welcome to lunabeam!</CardTitle>
            <p className="text-black">
              Before we start, I need to know who's creating this account.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label className="text-base font-semibold text-left">Who is the main user for lunabeam?</Label>
              <div className="space-y-3">
                <button
                  onClick={() => handleRoleSelection('individual')}
                  className="w-full p-4 rounded-full hover:opacity-80 transition-colors text-center"
                  style={{ backgroundColor: '#E0E0E0' }}
                >
                  <div className="text-sm text-black">I'm creating this account for myself</div>
                </button>
                <button
                  onClick={() => handleRoleSelection('parent')}
                  className="w-full p-4 rounded-full hover:opacity-80 transition-colors text-center"
                  style={{ backgroundColor: '#E0E0E0' }}
                >
                  <div className="text-sm text-black">I'm creating this account on someone else's behalf.</div>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <OnboardingConversation roleData={roleData as { role: 'parent' | 'individual'; individualEmail?: string }} onComplete={handleOnboardingComplete} />;
}
