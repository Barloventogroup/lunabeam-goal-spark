import React, { useState } from 'react';
import { SkillsScanStep } from './skills-scan-step';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { useStore } from '@/store/useStore';
import { supabase } from '@/integrations/supabase/client';
import { X, CalendarIcon, Check, Rocket } from 'lucide-react';
import { format } from 'date-fns';
import { EfPillarId } from '@/ef/efModel';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ParentOnboardingData {
  preferred_name: string;
  pronouns: string;
  birthday: Date | undefined;
  
  // EF Challenge Areas (simplified for onboarding)
  ef_selected_pillars: EfPillarId[];
}

interface ParentOnboardingProps {
  onComplete: () => void;
  onExit: () => Promise<void>;
  onBack?: () => void;
}

const PRONOUNS_OPTIONS = [
  'she/her', 'he/him', 'they/them', 'she/they', 'he/they', 
  'name only', 'Prefer not to say', 'Custom'
];

const AGE_OPTIONS = ['13–15', '16–18', '19–22', '23–26', '27+', 'Prefer not to say'];

export function ParentOnboarding({ onComplete, onExit, onBack }: ParentOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<ParentOnboardingData>({
    preferred_name: '',
    pronouns: '',
    birthday: undefined,
    ef_selected_pillars: []
  });
  const [customPronouns, setCustomPronouns] = useState('');
  const [birthdayDrawerOpen, setBirthdayDrawerOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { completeOnboarding, setProfile, refreshProfile, loadGoals } = useStore();

  const totalSteps = 5;

  const handleNext = () => {
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

      // Step 1: Save admin/supporter profile
      const adminProfile = {
        user_id: user.id,
        first_name: data.preferred_name,
        strengths: [],
        interests: [],
        challenges: [],
        comm_pref: 'text' as const,
        onboarding_complete: true,
        user_type: 'admin' as const,
        has_seen_welcome: true
      };

      await supabase
        .from('profiles')
        .update(adminProfile)
        .eq('user_id', user.id);

      // Step 2: Provision individual profile via RPC
      const { data: provisionResult, error: provisionError } = await supabase
        .rpc('provision_individual_direct', {
          p_first_name: data.preferred_name,
          p_strengths: [],
          p_interests: [],
          p_comm_pref: 'text'
        });

      if (provisionError) throw provisionError;

      const individualUserId = provisionResult && provisionResult[0] 
        ? provisionResult[0].individual_id 
        : null;
      
      if (!individualUserId) {
        throw new Error('Failed to create individual profile');
      }

      // Step 3: Save EF data and birthday to individual's profile
      await supabase
        .from('profiles')
        .update({
          first_name: data.preferred_name,
          birthday: data.birthday?.toISOString().split('T')[0],
          metadata: {
            ef_selected_pillars: data.ef_selected_pillars,
            ef_selection_date: new Date().toISOString(),
            ef_selection_source: 'onboarding_triage',
            ef_selection_perspective: 'parent'
          }
        } as any)
        .eq('user_id', individualUserId);

      // Step 4: Refresh profile to get latest data
      await refreshProfile();

      // Wait longer for state updates to propagate to ALL components
      await new Promise(resolve => setTimeout(resolve, 200));

      // Step 5: Complete onboarding and navigate
      await completeOnboarding();
      onComplete?.();
      
    } catch (error) {
      console.error('Error completing parent onboarding:', error);
      toast.error('Failed to complete setup');
    } finally {
      setIsCreating(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return data.preferred_name.trim().length > 0;
      case 2: return !!data.pronouns;
      case 3: return !!data.birthday;
      case 4: return data.ef_selected_pillars.length > 0;
      case 5: return true;
      default: return false;
    }
  };

  const progressPercentage = (currentStep / totalSteps) * 100;

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
        {currentStep !== 5 && (
          <div className="space-y-2 mb-6">
            {currentStep === 1 && (
              <>
            <h2 className="text-3xl font-semibold">What's their name?</h2>
            <p className="text-sm text-muted-foreground">
              The person you're helping
            </p>
              </>
            )}
            
            {currentStep === 2 && (
              <>
                <h2 className="text-3xl font-semibold">What are their pronouns?</h2>
                <p className="text-sm text-muted-foreground">
                  This helps us personalize their experience
                </p>
              </>
            )}
            
            {currentStep === 3 && (
              <>
                <h2 className="text-3xl font-semibold">How old is {data.preferred_name || 'they'}?</h2>
                <p className="text-sm text-muted-foreground">
                  We'll use this to personalize their experience
                </p>
              </>
            )}
            
            {currentStep === 4 && (
              <>
                <h2 className="text-3xl font-semibold">
                  What seems hardest for {data.preferred_name} right now?
                </h2>
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
            placeholder="Enter their name"
            value={data.preferred_name}
            onChange={(e) => setData({ ...data, preferred_name: e.target.value })}
            className="text-lg"
            autoFocus
          />
        )}
        
        {currentStep === 2 && (
          <div className="bg-card p-8 rounded-lg shadow-md border border-border">
            <RadioGroup
              value={data.pronouns}
              onValueChange={(value) => setData({ ...data, pronouns: value })}
            >
              {PRONOUNS_OPTIONS.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={option} />
                  <Label htmlFor={option} className="cursor-pointer flex-1">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            
            {data.pronouns === 'Custom' && (
              <Input
                placeholder="Enter custom pronouns"
                value={customPronouns}
                onChange={(e) => setCustomPronouns(e.target.value)}
                className="mt-4"
              />
            )}
          </div>
        )}
        
        {currentStep === 3 && (
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
                  <DrawerTitle>Select their birthday</DrawerTitle>
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
        
        {currentStep === 4 && (
          <SkillsScanStep
            role="parent"
            individualName={data.preferred_name}
            selectedPillars={data.ef_selected_pillars}
            onPillarsChange={(pillars) => {
              setData({ ...data, ef_selected_pillars: pillars });
            }}
          />
        )}
        
        {currentStep === 5 && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Check className="w-10 h-10 text-primary" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold">You're all set!</h2>
              <p className="text-muted-foreground max-w-md">
                {data.preferred_name}'s profile is ready. They'll be able to start working on their goal right away.
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Fixed footer with navigation */}
      <div className="fixed bottom-safe left-0 right-0 bg-card border-t border-border flex items-center justify-between px-6 py-4 shadow-[0_-2px_8px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-4 w-full justify-between">
          {currentStep > 1 && currentStep < 5 && (
            <BackButton onClick={handleBack} variant="text" />
          )}
          
          <div className="flex items-center gap-4 flex-1 justify-end">
            {currentStep < 5 && (
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
            
            {currentStep === 5 && (
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
