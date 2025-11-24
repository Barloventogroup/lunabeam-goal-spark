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
  const handleOnboardingComplete = async () => {
    console.log('OnboardingFlow: Onboarding complete, setting flag and reloading data');
    
    // Set flag for AppRouter
    sessionStorage.setItem('onboarding-just-completed', 'true');
    
    // Force reload of fresh data BEFORE navigation
    await loadProfile();
    
    // Small delay to ensure state propagation
    await new Promise(resolve => setTimeout(resolve, 150));
    
    console.log('OnboardingFlow: Data refreshed, navigating to home');
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
    return <div className="min-h-[100dvh] bg-gradient-soft pt-safe-header pb-safe-nav">
        {/* Fixed header with logo */}
        <div className="fixed left-0 right-0 top-safe z-40 flex items-center justify-between px-4 h-16 bg-card border-b border-border">
          <img src="/lovable-uploads/7f6e5283-da38-4bfc-ac26-ae239e843b39.png" alt="Lunabeam" className="h-7 w-auto object-contain" />
          <Button variant="ghost" size="sm" onClick={handleExit} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Scrollable content */}
        <div className="px-4 pt-16 pb-24 overflow-y-auto max-w-2xl mx-auto">
          {/* Message text at ~128px from top */}
          <div className="space-y-2 mb-6 text-center">
            <h2 className="text-3xl font-semibold">
              {isParent ? 'Perfect! You\'ll be set as the Admin.' : 'Great! Let\'s personalize your experience.'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isParent ? 'As the parent or caregiver, you will be set as the Admin. You can later invite coaches, therapists, or family members to join the team.' : 'The next questions will help me suggest goals and personalize your experience. Ready?'}
            </p>
          </div>
        </div>
        
        {/* Fixed footer with navigation only */}
        <div className="fixed bottom-safe left-0 right-0 bg-card border-t border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <BackButton onClick={() => { setShowInterstitial(false); setShowRoleSelection(true); }} variant="text" />
            <Button onClick={handleInterstitialNext}>
              Continue
            </Button>
          </div>
        </div>
      </div>;
  }
  if (showRoleSelection) {
    return <div className="min-h-[100dvh] bg-gradient-soft pt-safe-header pb-safe-nav">
        {/* Fixed header with logo */}
        <div className="fixed left-0 right-0 top-safe z-40 flex items-center justify-between px-4 h-16 bg-card border-b border-border">
          <img src="/lovable-uploads/7f6e5283-da38-4bfc-ac26-ae239e843b39.png" alt="Lunabeam" className="h-7 w-auto object-contain" />
          <Button variant="ghost" size="sm" onClick={handleExit} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Scrollable content */}
        <div className="px-4 pt-16 pb-24 overflow-y-auto max-w-2xl mx-auto">
          {/* Question text at ~128px from top */}
          <div className="space-y-2 mb-6">
            <h2 className="text-3xl font-semibold">Welcome to Lunabeam!</h2>
            <p className="text-sm text-muted-foreground">
              Who are you creating this account for?
            </p>
          </div>
          
          {/* Role selection cards */}
          <div className="space-y-4">
            <div 
              className={`w-full p-4 rounded-lg border-2 cursor-pointer transition-all bg-card ${
                selectedRole === 'parent' 
                  ? 'border-primary shadow-md' 
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => setSelectedRole('parent')}
            >
              <div className="space-y-1">
                <Label className="text-base font-medium cursor-pointer">
                  I am a parent/caregiver signing up on behalf of someone else
                </Label>
                <p className="text-sm text-muted-foreground">
                  You'll manage the account and can invite others to join the team
                </p>
              </div>
            </div>
            
            <div 
              className={`w-full p-4 rounded-lg border-2 cursor-pointer transition-all bg-card ${
                selectedRole === 'individual' 
                  ? 'border-primary shadow-md' 
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => setSelectedRole('individual')}
            >
              <div className="space-y-1">
                <Label className="text-base font-medium cursor-pointer">
                  I am signing up for myself
                </Label>
                <p className="text-sm text-muted-foreground">
                  You'll have full control of your own account
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Fixed footer with navigation only */}
        <div className="fixed bottom-safe left-0 right-0 bg-card border-t border-border px-6 py-4">
          <div className="flex justify-end">
            <Button onClick={() => handleRoleSelection(selectedRole)}>
              Continue
            </Button>
          </div>
        </div>
      </div>;
  }
  return <OnboardingConversation roleData={roleData as {
    role: 'parent' | 'individual';
    isAdmin?: boolean;
  }} onComplete={handleOnboardingComplete} onExit={handleExit} onBack={() => setShowInterstitial(true)} />;
}