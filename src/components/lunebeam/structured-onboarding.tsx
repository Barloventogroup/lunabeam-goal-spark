import React, { useState } from 'react';
import { SkillsScanStep } from './skills-scan-step';
import { GoalIntentStep } from './goal-intent-step';
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
import { goalsService } from '@/services/goalsService';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import lunabeamIcon from '@/assets/lunabeam-logo-icon.svg';

interface OnboardingData {
  first_name: string;
  birthday: Date | undefined;
  
  // EF Challenge Areas (simplified for onboarding)
  ef_selected_pillars: EfPillarId[];
  
  // Goal Intent fields
  goalIntent?: {
    title: string;
    templateId?: string;
    timeframe: 'short_term' | 'mid_term' | 'long_term';
    focusAreas: string[];
  };
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
    ef_selected_pillars: [],
    goalIntent: undefined
  });
  const [birthdayDrawerOpen, setBirthdayDrawerOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { completeOnboarding, setProfile, refreshProfile, loadGoals } = useStore();

  const getTotalSteps = () => {
    return 5; // name, birthday, skills scan, goal intent, confirmation
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

      // Create goal if one was selected
      if (data.goalIntent) {
        const goal = await goalsService.createGoal({
          title: data.goalIntent.title,
          description: '',
          priority: 'medium',
          owner_id: user.id,
          domain: 'other'
        });

        await supabase
          .from('goals')
          .update({
            metadata: {
              created_via: 'onboarding_quickintent',
              ef_focus_areas: data.ef_selected_pillars,
              template_id: data.goalIntent.templateId,
              timeframe: data.goalIntent.timeframe,
              needs_full_setup: true
            }
          })
          .eq('id', goal.id);
      }

      // Refresh profile and goals to get latest data
      await refreshProfile();
      await loadGoals();

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
      case 4: 
        return data.goalIntent?.title 
          && data.goalIntent?.timeframe;
      case 5: return true;
      default: return false;
    }
  };

  const progressPercentage = (currentStep / getTotalSteps()) * 100;

  return (
    <div className="min-h-[100dvh] flex flex-col">
      {/* Exit button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onExit}
        className="absolute top-safe-with-margin right-4 h-8 w-8 p-0 text-muted-foreground hover:text-foreground z-50"
      >
        <X className="h-4 w-4" />
      </Button>
      
      {/* HEADER - 50% */}
      <div className="h-[50vh] bg-white flex flex-col justify-end p-6 pt-safe-with-6">
        <div className="max-w-2xl mx-auto w-full">
          {currentStep === 1 && (
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold">What would you like to be called?</h2>
              <p className="text-sm text-black">
                Just your first name or nickname is perfect
              </p>
            </div>
          )}
          
          {currentStep === 2 && (
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold">How old are you?</h2>
              <p className="text-sm text-black">
                We'll use this to personalize your experience
              </p>
            </div>
          )}
          
          {currentStep === 3 && (
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold">What feels hardest right now?</h2>
              <p className="text-sm text-black">
                Pick up to 3 areas that feel like they cause the most friction day to day. You can change this later.
              </p>
            </div>
          )}
          
          {currentStep === 4 && (
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold">Pick one thing to make easier</h2>
              <p className="text-sm text-black">
                Let's start with a goal for the next few weeks.
              </p>
            </div>
          )}
          
          {currentStep === 5 && (
            <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-6 text-center">
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
      </div>
      
      {/* BODY - 43.75% */}
      <div className="h-[43.75vh] bg-gray-100 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto w-full">
          {currentStep === 1 && (
            <div className="space-y-6 bg-white p-8 rounded-lg shadow-md">
              <Input
                type="text"
                placeholder="Enter your name"
                value={data.first_name}
                onChange={(e) => setData({ ...data, first_name: e.target.value })}
                className="text-lg"
                autoFocus
              />
            </div>
          )}
          
          {currentStep === 2 && (
            <div className="space-y-6 bg-white p-8 rounded-lg shadow-md">
              <button
                onClick={() => setBirthdayDrawerOpen(true)}
                className={cn(
                  "w-full px-4 py-3 text-left border rounded-md flex items-center justify-between",
                  data.birthday ? "border-primary" : "border-input"
                )}
              >
                <span className={data.birthday ? "text-foreground" : "text-muted-foreground"}>
                  {data.birthday ? format(data.birthday, 'MMMM d, yyyy') : 'Select your birthday'}
                </span>
                <CalendarIcon className="h-5 w-5 text-muted-foreground" />
              </button>
              
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
            <GoalIntentStep
              selectedPillars={data.ef_selected_pillars}
              onGoalSelected={(goal) => {
                setData({ ...data, goalIntent: goal });
                handleNext();
              }}
              onSkip={() => handleNext()}
            />
          )}
        </div>
      </div>
      
      {/* FOOTER - 6.25% */}
      <div className="min-h-[6.25vh] bg-white flex items-center justify-between px-6 gap-3 shadow-[0_-2px_8px_rgba(0,0,0,0.1)] pb-safe-only">
        <img src={lunabeamIcon} alt="Lunabeam" className="h-16 w-16" />
        <div className="flex items-center gap-4 flex-1 justify-end">
          {currentStep > 1 && currentStep < 5 && (
            <BackButton onClick={handleBack} variant="text" />
          )}
          
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
  );
}
