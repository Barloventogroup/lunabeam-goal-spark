import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingConversation } from './onboarding-conversation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export function OnboardingFlow() {
  const navigate = useNavigate();
  const [roleData, setRoleData] = useState<{ role: 'parent' | 'individual' | ''; isAdmin?: boolean; adminName?: string; adminRole?: string }>({ role: '' });
  const [showRoleSelection, setShowRoleSelection] = useState(true);
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [showAdminInfo, setShowAdminInfo] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [adminRole, setAdminRole] = useState('');

  const handleRoleSelection = (role: 'parent' | 'individual') => {
    // Automatically assign Admin role to parents/caregivers
    const isAdmin = role === 'parent';
    setRoleData({ role, isAdmin });
    
    if (role === 'parent') {
      setShowAdminInfo(true);
    } else {
      setShowInterstitial(true);
    }
  };

  const handleAdminInfoNext = () => {
    setRoleData(prev => ({ ...prev, adminName, adminRole }));
    setShowAdminInfo(false);
    setShowInterstitial(true);
  };

  const handleInterstitialNext = () => {
    setShowRoleSelection(false);
    setShowInterstitial(false);
  };

  const handleOnboardingComplete = () => {
    navigate('/');
  };

  // Show admin info collection screen
  if (showAdminInfo) {
    const ROLE_OPTIONS = ['Parent', 'Caregiver', 'Friend', 'Coach', 'Therapist', 'Family Member', 'Other'];
    
    return (
      <div className="min-h-screen bg-gradient-soft p-4 flex items-center justify-center">
        <div className="max-w-md mx-auto">
          <Card className="shadow-card border-0">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-xl">👨‍👩‍👧‍👦</span>
              </div>
              <CardTitle className="text-xl">Tell us about yourself</CardTitle>
              <p className="text-sm text-foreground-soft">
                As the parent or caregiver, you will be set as the Admin. You can later invite coaches, therapists, or family members to join the team.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="admin-name" className="text-sm font-medium">Your name</Label>
                <Input
                  id="admin-name"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="Enter your name"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label className="text-sm font-medium">Your role</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {ROLE_OPTIONS.map(role => (
                    <Button
                      key={role}
                      variant={adminRole === role ? "default" : "outline"}
                      onClick={() => setAdminRole(role)}
                      className="text-sm h-auto py-1 px-3"
                    >
                      {role}
                    </Button>
                  ))}
                </div>
              </div>
              
              <Button
                onClick={handleAdminInfoNext}
                disabled={!adminName.trim() || !adminRole}
                className="w-full mt-6"
              >
                Continue
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show interstitial screen
  if (showInterstitial) {
    const isParent = roleData.role === 'parent';
    return (
      <div className="min-h-screen bg-gradient-soft p-4 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center space-y-6">
          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
            <span className="text-white text-xl">{isParent ? '👨‍👩‍👧‍👦' : '🙋‍♂️'}</span>
          </div>
          <div>
            <h1 className="text-xl font-medium text-black mb-4">
              {isParent ? `Welcome ${roleData.adminName}! You're all set as the Admin.` : 'Great! Let\'s personalize your experience.'}
            </h1>
            <p className="text-sm text-foreground-soft">
              {isParent 
                ? 'The next questions will help me suggest goals and personalize their experience. Ready?' 
                : 'The next questions will help me suggest goals and personalize your experience. Ready?'
              }
            </p>
          </div>
          <Button
            onClick={handleInterstitialNext}
            className="w-full"
          >
            Continue
          </Button>
        </div>
      </div>
    );
  }

  if (showRoleSelection) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #E8F0F3 0%, #f0f8fb 100%)' }}>
        <Card className="w-full max-w-md shadow-card border-0">
          <CardHeader className="text-left">
            <CardTitle className="text-2xl">Welcome to lunabeam!</CardTitle>
            <p className="text-black">
              Who are you creating this account for?
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup value={roleData.role} onValueChange={(value) => handleRoleSelection(value as 'parent' | 'individual')}>
              <div className="space-y-3">
                <div 
                  className="w-full p-4 rounded-lg border-2 border-primary bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => handleRoleSelection('parent')}
                >
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="parent" id="parent" />
                    <div className="flex-1">
                      <Label htmlFor="parent" className="text-sm font-medium cursor-pointer">
                        I am a parent/caregiver signing up on behalf of someone else
                      </Label>
                      <p className="text-xs text-foreground-soft mt-1">
                        You'll manage the account and can invite others to join the team
                      </p>
                    </div>
                  </div>
                </div>
                
                <div 
                  className="w-full p-4 rounded-lg border border-border cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => handleRoleSelection('individual')}
                >
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="individual" id="individual" />
                    <div className="flex-1">
                      <Label htmlFor="individual" className="text-sm font-medium cursor-pointer">
                        I am signing up for myself
                      </Label>
                      <p className="text-xs text-foreground-soft mt-1">
                        You'll have full control of your own account
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </RadioGroup>
              
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
              <div className="flex items-start space-x-2">
                <div className="text-blue-600 mt-0.5">💡</div>
                <div>
                  <p className="text-xs text-blue-800 font-medium">As the parent or caregiver, you will be set as the Admin. You can later invite coaches, therapists, or family members to join the team.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <OnboardingConversation roleData={roleData as { role: 'parent' | 'individual'; isAdmin?: boolean; adminName?: string; adminRole?: string }} onComplete={handleOnboardingComplete} />;
}
