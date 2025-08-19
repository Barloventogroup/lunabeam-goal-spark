import React, { useState } from 'react';
import { OnboardingConversation } from './onboarding-conversation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

export function OnboardingFlow() {
  const [roleData, setRoleData] = useState<{ role: 'parent' | 'individual' | ''; individualEmail?: string }>({ role: '' });
  const [showRoleSelection, setShowRoleSelection] = useState(true);

  const handleRoleSelection = (role: 'parent' | 'individual') => {
    setRoleData({ role });
    setShowRoleSelection(false);
  };

  if (showRoleSelection) {
    return (
      <div className="min-h-screen bg-gradient-soft p-4 flex items-center justify-center">
        <Card className="w-full max-w-md shadow-card border-0">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-xl font-bold">L</span>
            </div>
            <CardTitle className="text-2xl">Hi! I'm Lune 🌙</CardTitle>
            <p className="text-foreground-soft">
              I'm your personal assistant. Before we start, I need to know who's creating this account.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label className="text-base font-semibold">Who is the main user for this app?</Label>
              <RadioGroup value={roleData.role} onValueChange={(value) => handleRoleSelection(value as 'parent' | 'individual')}>
                <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="individual" id="individual" />
                  <Label htmlFor="individual" className="flex-1 cursor-pointer">
                    <div>
                      <div className="font-semibold">Individual</div>
                      <div className="text-sm text-foreground-soft">I'm creating this account for myself</div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="parent" id="parent" />
                  <Label htmlFor="parent" className="flex-1 cursor-pointer">
                    <div>
                      <div className="font-semibold">Parent</div>
                      <div className="text-sm text-foreground-soft">I'm creating this account for my child</div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <OnboardingConversation roleData={roleData as { role: 'parent' | 'individual'; individualEmail?: string }} onComplete={() => {}} />;
}
