import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingConversation } from './onboarding-conversation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/components/auth/auth-provider';
import { X } from 'lucide-react';
import { BackButton } from '@/components/ui/back-button';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/store/useStore';
import { updateUserRole } from '@/utils/roleUtils';
import lunabeamIcon from '@/assets/lunabeam-logo-icon.svg';
export function OnboardingFlow() {
  const navigate = useNavigate();
  const {
    signOut
  } = useAuth();
  const {
    loadProfile
  } = useStore();
  const [roleData, setRoleData] = useState<{
    role: 'parent' | 'individual' | '';
    isAdmin?: boolean;
  }>({
    role: ''
  });
  const [selectedRole, setSelectedRole] = useState<'parent' | 'individual'>('parent');
  const [showRoleSelection, setShowRoleSelection] = useState(true);
  const [showInterstitial, setShowInterstitial] = useState(false);
  const handleRoleSelection = async (role: 'parent' | 'individual') => {
    // Automatically assign Admin role to parents/caregivers
    const isAdmin = role === 'parent';
    setRoleData({
      role,
      isAdmin
    });
    setShowInterstitial(true);
    try {
      const newRole = isAdmin ? 'admin' : 'individual';
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
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
    return <div className="min-h-screen flex flex-col">
        {/* Exit button */}
        <Button variant="ghost" size="sm" onClick={handleExit} className="absolute top-4 right-4 h-8 w-8 p-0 text-muted-foreground hover:text-foreground z-50">
          <X className="h-4 w-4" />
        </Button>
        
        {/* HEADER - 50% */}
        <div className="h-[50vh] bg-white flex flex-col justify-end p-6">
          <div className="space-y-2 text-center">
            <h1 className="text-xl font-medium text-black">
              {isParent ? 'Perfect! You\'ll be set as the Admin.' : 'Great! Let\'s personalize your experience.'}
            </h1>
            <p className="text-sm text-foreground-soft">
              {isParent ? 'As the parent or caregiver, you will be set as the Admin. You can later invite coaches, therapists, or family members to join the team.' : 'The next questions will help me suggest goals and personalize your experience. Ready?'}
            </p>
          </div>
        </div>
        
        {/* BODY - 43.75% */}
        <div className="h-[43.75vh] bg-gray-100"></div>
        
        {/* FOOTER - 6.25% */}
        <div className="h-[6.25vh] bg-white flex items-center justify-between px-6 gap-3">
          <img src={lunabeamIcon} alt="Lunabeam" className="h-16 w-16" />
          <div className="flex items-center gap-3">
            <BackButton onClick={() => setShowInterstitial(false)} variant="text" />
            <Button onClick={handleInterstitialNext}>
              Continue
            </Button>
          </div>
        </div>
      </div>;
  }
  if (showRoleSelection) {
    return <div className="min-h-screen flex flex-col">
        {/* Exit button */}
        <Button variant="ghost" size="sm" onClick={handleExit} className="absolute top-4 right-4 h-8 w-8 p-0 text-muted-foreground hover:text-foreground z-50">
          <X className="h-4 w-4" />
        </Button>
        
        {/* HEADER - 50% */}
        <div className="h-[50vh] bg-white flex flex-col justify-end p-6">
          <div className="max-w-2xl mx-auto w-full">
            <div className="text-left space-y-2">
              <CardTitle className="text-3xl">Welcome to Lunabeam!</CardTitle>
              <p className="text-foreground">Who are you creating this account for?</p>
            </div>
          </div>
        </div>
        
        {/* BODY - 43.75% */}
        <div className="h-[43.75vh] bg-gray-100 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto">
            <div className="space-y-4">
              <div 
                className={`w-full p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedRole === 'parent' 
                    ? 'border-primary bg-white shadow-md' 
                    : 'border-border bg-transparent hover:border-primary/50'
                }`}
                onClick={() => setSelectedRole('parent')}
              >
                <div className="space-y-1">
                  <Label className="text-sm font-medium cursor-pointer">
                    I am a parent/caregiver signing up on behalf of someone else
                  </Label>
                  <p className="text-xs text-foreground-soft">
                    You'll manage the account and can invite others to join the team
                  </p>
                </div>
              </div>
              
              <div 
                className={`w-full p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedRole === 'individual' 
                    ? 'border-primary bg-white shadow-md' 
                    : 'border-border bg-transparent hover:border-primary/50'
                }`}
                onClick={() => setSelectedRole('individual')}
              >
                <div className="space-y-1">
                  <Label className="text-sm font-medium cursor-pointer">
                    I am signing up for myself
                  </Label>
                  <p className="text-xs text-foreground-soft">
                    You'll have full control of your own account
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* FOOTER - 6.25% */}
        <div className="h-[6.25vh] bg-white flex items-center justify-between px-6">
          <img src={lunabeamIcon} alt="Lunabeam" className="h-16 w-16" />
          <Button onClick={() => handleRoleSelection(selectedRole)}>
            Continue
          </Button>
        </div>
      </div>;
  }
  return <OnboardingConversation roleData={roleData as {
    role: 'parent' | 'individual';
    isAdmin?: boolean;
  }} onComplete={handleOnboardingComplete} onExit={handleExit} />;
}