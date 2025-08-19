import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface OnboardingRoleSelectionProps {
  onComplete: (data: { role: 'parent' | 'individual'; individualEmail?: string }) => void;
}

export function OnboardingRoleSelection({ onComplete }: OnboardingRoleSelectionProps) {
  const [role, setRole] = useState<'parent' | 'individual' | ''>('');
  const [individualEmail, setIndividualEmail] = useState('');

  const handleContinue = () => {
    if (role) {
      onComplete({
        role: role as 'parent' | 'individual',
        individualEmail: role === 'parent' ? individualEmail : undefined
      });
    }
  };

  const canContinue = role && (role === 'individual' || (role === 'parent' && individualEmail.trim().length > 0));

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
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-xl font-bold">L</span>
              </div>
              <h1 className="text-2xl font-bold mb-2">Hi! I'm Lune 🌙</h1>
              <p className="text-foreground-soft">
                I'm your personal AI assistant. Before we start, I need to know who's creating this account.
              </p>
            </div>

            <div className="space-y-4">
              <Label className="text-base font-semibold">Who is the main user for this app?</Label>
              <RadioGroup value={role} onValueChange={(value) => setRole(value as 'parent' | 'individual')}>
                <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="individual" id="individual" />
                  <Label htmlFor="individual" className="flex-1 cursor-pointer">
                    <div>
                      <div className="font-semibold">Individual</div>
                      <div className="text-sm text-foreground-soft">I'm creating this account for myself</div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="parent" id="parent" />
                  <Label htmlFor="parent" className="flex-1 cursor-pointer">
                    <div>
                      <div className="font-semibold">Parent</div>
                      <div className="text-sm text-foreground-soft">I'm creating this account for my child</div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>

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
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 mt-6">
          <Button
            onClick={handleContinue}
            disabled={!canContinue}
            className="w-full"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}