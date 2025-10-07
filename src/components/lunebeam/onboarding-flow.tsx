import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingConversation } from './onboarding-conversation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/components/auth/auth-provider';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/store/useStore';
import { updateUserRole } from '@/utils/roleUtils';

export function OnboardingFlow() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { loadProfile } = useStore();
  const [roleData, setRoleData] = useState<{ role: 'parent' | 'individual' | ''; isAdmin?: boolean }>({ role: '' });
  const [selectedRole, setSelectedRole] = useState<'parent' | 'individual'>('parent');
  const [showRoleSelection, setShowRoleSelection] = useState(true);
  const [showInterstitial, setShowInterstitial] = useState(false);

  const handleRoleSelection = async (role: 'parent' | 'individual') => {
    // Automatically assign Admin role to parents/caregivers
    const isAdmin = role === 'parent';
    setRoleData({ role, isAdmin });
    setShowInterstitial(true);

    try {
      const newRole = isAdmin ? 'admin' : 'individual';
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const res = await updateUserRole(user.id, newRole);
        if (res?.error) {
          console.error('OnboardingFlow: Error updating user role:', res.error);
        } else {
          // Refresh profile/userContext so downstream UI picks up the correct role
          await loadProfile();
        }
      }
    } catch (err) {
      console.error('OnboardingFlow: Failed to persist selected role', err);
    }
  };
  const handleInterstitialNext = () => {
    setShowRoleSelection(false);
    setShowInterstitial(false);
  };

  const handleOnboardingComplete = () => {
    navigate('/');
  };

  const handleExit = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
      // Still navigate to auth even if signOut fails
      navigate('/auth');
    }
  };

  // Show interstitial screen
  if (showInterstitial) {
    const isParent = roleData.role === 'parent';
    return (
      <div className="min-h-screen bg-gradient-soft">
        <Card className="shadow-none border-0 h-screen w-full rounded-none relative">
          {/* Exit button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExit}
            className="absolute top-4 right-4 h-8 w-8 p-0 text-muted-foreground hover:text-foreground z-10"
          >
            <X className="h-4 w-4" />
          </Button>
          
          <CardContent className="p-6 h-full flex flex-col justify-center text-center">
            <div className="flex-1 flex flex-col justify-center space-y-6">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
                <span className="text-white text-xl">{isParent ? '👨‍👩‍👧‍👦' : '🙋‍♂️'}</span>
              </div>
              <div>
                <h1 className="text-xl font-medium text-black mb-4">
                  {isParent ? 'Perfect! You\'ll be set as the Admin.' : 'Great! Let\'s personalize your experience.'}
                </h1>
                <p className="text-sm text-foreground-soft">
                  {isParent 
                    ? 'As the parent or caregiver, you will be set as the Admin. You can later invite coaches, therapists, or family members to join the team.' 
                    : 'The next questions will help me suggest goals and personalize your experience. Ready?'
                  }
                </p>
              </div>
            </div>
          </CardContent>
          
          <div className="absolute bottom-6 right-6">
            <Button onClick={handleInterstitialNext}>
              Continue
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (showRoleSelection) {
    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #E8F0F3 0%, #f0f8fb 100%)' }}>
        <Card className="shadow-none border-0 h-screen w-full rounded-none relative">
          {/* Exit button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExit}
            className="absolute top-4 right-4 h-8 w-8 p-0 text-muted-foreground hover:text-foreground z-10"
          >
            <X className="h-4 w-4" />
          </Button>
          
          <CardContent className="p-6 h-full flex flex-col overflow-y-auto">
            <div className="flex-1 flex flex-col justify-center">
              <div className="text-center mb-8">
                <CardTitle className="text-2xl mb-4">Welcome to lunabeam!</CardTitle>
                <p className="text-black">
                  Who are you creating this account for?
                </p>
              </div>
              
              <div className="space-y-6">
                <RadioGroup value={selectedRole} onValueChange={(v) => setSelectedRole(v as 'parent' | 'individual')} className="space-y-4">
                  <div className="space-y-3">
                    <div 
                      className="w-full p-4 rounded-lg border-2 border-primary bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors"
                      onClick={() => setSelectedRole('parent')}
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
                      onClick={() => setSelectedRole('individual')}
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
              </div>
            </div>
          </CardContent>
          
          <div className="absolute bottom-6 right-6">
            <Button 
              onClick={() => handleRoleSelection(selectedRole)}
            >
              Continue
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return <OnboardingConversation roleData={roleData as { role: 'parent' | 'individual'; isAdmin?: boolean }} onComplete={handleOnboardingComplete} onExit={handleExit} />;
}
