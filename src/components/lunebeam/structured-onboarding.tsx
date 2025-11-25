import React, { useState } from 'react';
import { SkillsScanStep } from './skills-scan-step';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { useStore } from '@/store/useStore';
import { supabase } from '@/integrations/supabase/client';
import { X, CalendarIcon, Check, Rocket } from 'lucide-react';
import { format } from 'date-fns';
import { EfPillarId } from '@/ef/efModel';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface OnboardingData {
  first_name: string;
  birthday: Date | undefined;
  
  // EF Challenge Areas (simplified for onboarding)
  ef_selected_pillars: EfPillarId[];
}

interface StructuredOnboardingProps {
  onComplete: () => void;
  roleData?: { role: 'parent' | 'individual'; isAdmin?: boolean };
  onExit: () => Promise<void>;
  onBack?: () => void;
}

export function StructuredOnboarding({ onComplete, roleData, onExit, onBack }: StructuredOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    first_name: '',
    birthday: undefined,
    ef_selected_pillars: []
  });
  const [birthdayDrawerOpen, setBirthdayDrawerOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { completeOnboarding, setProfile, refreshProfile, loadGoals } = useStore();

  const getTotalSteps = () => {
    return 4; // name, birthday, skills scan, confirmation
  };

  const handleNext = async () => {
    const totalSteps = getTotalSteps();
    
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep === 1 && onBack) {
      onBack();
    } else if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (isCreating) return;
    
    setIsCreating(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('No user found');
        return;
      }

      // Save profile with minimal data
      const profileData = {
        user_id: user.id,
        first_name: data.first_name,
        birthday: data.birthday?.toISOString().split('T')[0],
        strengths: [],
        interests: [],
        challenges: [],
        comm_pref: 'text' as const,
        metadata: {
          ef_selected_pillars: data.ef_selected_pillars,
          ef_selection_date: new Date().toISOString(),
          ef_selection_source: 'onboarding_triage',
          ef_selection_perspective: 'individual'
        },
        onboarding_complete: true
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('user_id', user.id);

      if (profileError) {
        console.error('Failed to save profile:', profileError);
        toast.error('Failed to save your profile');
        return;
      }

      // Refresh profile to get latest data
      await refreshProfile();

      // Wait longer for state updates to propagate to ALL components
      await new Promise(resolve => setTimeout(resolve, 200));

      // Complete onboarding and navigate to home
      await completeOnboarding();
      onComplete?.();
      
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Failed to complete setup');
    } finally {
      setIsCreating(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return data.first_name.trim().length > 0;
      case 2: return !!data.birthday;
      case 3: return data.ef_selected_pillars.length > 0;
      case 4: return true;
      default: return false;
    }
  };

  const progressPercentage = (currentStep / getTotalSteps()) * 100;

  return (
    <div className="min-h-[100dvh] bg-gradient-soft pt-safe-header pb-safe-nav">
      {/* Fixed header with logo */}
      <div className="fixed left-0 right-0 top-safe z-40 flex items-center justify-between px-4 h-16 bg-card border-b border-border">
        <img 
          src="/lovable-uploads/7f6e5283-da38-4bfc-ac26-ae239e843b39.png" 
          alt="Lunabeam" 
          className="h-7 w-auto object-contain" 
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={onExit}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Scrollable content */}
      <div className="px-4 pt-16 pb-24 overflow-y-auto max-w-2xl mx-auto">
        {/* Question text appears here at ~128px from top */}
        {currentStep !== 4 && (
          <div className="space-y-2 mb-6">
            {currentStep === 1 && (
              <>
            <h2 className="text-3xl font-semibold">What's your name?</h2>
            <p className="text-sm text-muted-foreground">
              First name or nickname is fine
            </p>
              </>
            )}
            
            {currentStep === 2 && (
              <>
                <h2 className="text-3xl font-semibold">How old are you?</h2>
                <p className="text-sm text-muted-foreground">
                  We'll use this to personalize your experience
                </p>
              </>
            )}
            
            {currentStep === 3 && (
              <>
                <h2 className="text-3xl font-semibold">What feels hardest right now?</h2>
                <p className="text-sm text-muted-foreground">
                  Pick up to 3 areas that feel like they cause the most friction day to day. You can change this later.
                </p>
              </>
            )}
          </div>
        )}
        
        {/* Input section in separate visual container */}
        {currentStep === 1 && (
          <Input
            type="text"
            placeholder="Enter your name"
            value={data.first_name}
            onChange={(e) => setData({ ...data, first_name: e.target.value })}
            className="text-lg"
            autoFocus
          />
        )}
        
        {currentStep === 2 && (
          <div className="bg-card p-4 rounded-lg shadow-md border border-border">
            <div className="flex items-center justify-between">
              <span className="text-base font-medium text-foreground">Birthday</span>
              <button
                onClick={() => setBirthdayDrawerOpen(true)}
                className="px-5 py-2.5 bg-secondary hover:bg-secondary/80 text-foreground rounded-full transition-colors"
              >
                {data.birthday ? format(data.birthday, 'MMMM d, yyyy') : 'Select date'}
              </button>
            </div>
            
            <Drawer open={birthdayDrawerOpen} onOpenChange={setBirthdayDrawerOpen}>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Select your birthday</DrawerTitle>
                </DrawerHeader>
                <div className="p-4 flex justify-center">
                  <Calendar
                    mode="single"
                    selected={data.birthday}
                    onSelect={(date) => {
                      setData({ ...data, birthday: date });
                      setBirthdayDrawerOpen(false);
                    }}
                    disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                    initialFocus
                    showYearPicker={true}
                  />
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        )}
        
        {currentStep === 3 && (
          <SkillsScanStep
            role="individual"
            selectedPillars={data.ef_selected_pillars}
            onPillarsChange={(pillars) => {
              setData({ ...data, ef_selected_pillars: pillars });
            }}
          />
        )}
        
        {currentStep === 4 && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Check className="w-10 h-10 text-primary" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold">You're all set!</h2>
              <p className="text-muted-foreground max-w-md">
                Your profile is ready. Let's start working on your goal.
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Fixed footer with navigation */}
      <div className="fixed bottom-safe left-0 right-0 bg-card border-t border-border flex items-center justify-between px-6 py-4 shadow-[0_-2px_8px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-4 w-full justify-between">
          {currentStep > 1 && currentStep < 4 && (
            <BackButton onClick={handleBack} variant="text" />
          )}
          
          <div className="flex items-center gap-4 flex-1 justify-end">
            {currentStep < 4 && (
              <>
                <Progress value={progressPercentage} className="flex-1 max-w-[200px]" />
                <Button 
                  onClick={handleNext} 
                  disabled={!canProceed()}
                >
                  Continue
                </Button>
              </>
            )}
            
            {currentStep === 4 && (
              <Button 
                onClick={handleComplete} 
                disabled={isCreating}
                className="ml-auto"
              >
                {isCreating ? 'Setting up...' : (
                  <>
                    Let's Go! <Rocket className="ml-1 h-5 w-5" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
