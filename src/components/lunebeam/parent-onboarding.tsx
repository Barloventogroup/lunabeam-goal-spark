import React, { useState } from 'react';
import { SkillsScanStep } from './skills-scan-step';
import { GoalIntentStep } from './goal-intent-step';
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
import { goalsService } from '@/services/goalsService';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import lunabeamIcon from '@/assets/lunabeam-logo-icon.svg';

interface ParentOnboardingData {
  preferred_name: string;
  pronouns: string;
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
    ef_selected_pillars: [],
    goalIntent: undefined
  });
  const [customPronouns, setCustomPronouns] = useState('');
  const [birthdayDrawerOpen, setBirthdayDrawerOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { completeOnboarding, setProfile, refreshProfile, loadGoals } = useStore();

  const totalSteps = 6;

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

      // Step 4: Create goal for individual (if selected)
      if (data.goalIntent) {
        const goal = await goalsService.createGoal({
          title: data.goalIntent.title,
          description: '',
          priority: 'medium',
          owner_id: individualUserId,
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
              needs_full_setup: true,
              created_by_supporter: true
            }
          })
          .eq('id', goal.id);
      }

      // Step 5: Refresh profile and goals to get latest data
      await refreshProfile();
      await loadGoals();

      // Wait longer for state updates to propagate to ALL components
      await new Promise(resolve => setTimeout(resolve, 200));

      // Step 6: Complete onboarding and navigate
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
      case 5: 
        return data.goalIntent?.title 
          && data.goalIntent?.timeframe;
      case 6: return true;
      default: return false;
    }
  };

  const progressPercentage = (currentStep / totalSteps) * 100;

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
      
      {/* HEADER - 50vh */}
      <div className="h-[50vh] bg-white flex flex-col justify-end p-6 pt-safe-with-6">
        <div className="max-w-2xl mx-auto w-full">
          {currentStep === 1 && (
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold">Who are you helping?</h2>
              <p className="text-foreground-soft">
                What name do they prefer?
              </p>
            </div>
          )}
          
          {currentStep === 2 && (
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold">What are their pronouns?</h2>
              <p className="text-foreground-soft">
                This helps us personalize their experience
              </p>
            </div>
          )}
          
          {currentStep === 3 && (
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold">How old is {data.preferred_name || 'they'}?</h2>
              <p className="text-foreground-soft">
                We'll use this to personalize their experience
              </p>
            </div>
          )}
          
          {currentStep === 4 && (
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold">
                What seems hardest for {data.preferred_name} right now?
              </h2>
              <p className="text-foreground-soft">
                Pick up to 3 areas that feel like they cause the most friction day to day. You can change this later.
              </p>
            </div>
          )}
          
          {currentStep === 5 && (
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold">
                Pick one goal for {data.preferred_name}
              </h2>
              <p className="text-foreground-soft">
                Let's start with something to work on in the next few weeks.
              </p>
            </div>
          )}
          
          {currentStep === 6 && (
            <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-6 text-center">
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
      </div>
      
      {/* BODY - 43.75vh */}
      <div className="h-[43.75vh] bg-gray-100 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto w-full">
          {currentStep === 1 && (
            <div className="space-y-6 bg-white p-8 rounded-lg shadow-md">
              <Input
                type="text"
                placeholder="Enter their name"
                value={data.preferred_name}
                onChange={(e) => setData({ ...data, preferred_name: e.target.value })}
                className="text-lg"
                autoFocus
              />
            </div>
          )}
          
          {currentStep === 2 && (
            <div className="space-y-4 bg-white p-8 rounded-lg shadow-md">
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
                />
              )}
            </div>
          )}
          
          {currentStep === 3 && (
            <div className="space-y-6 bg-white p-8 rounded-lg shadow-md">
              <button
                onClick={() => setBirthdayDrawerOpen(true)}
                className={cn(
                  "w-full px-4 py-3 text-left border rounded-md flex items-center justify-between",
                  data.birthday ? "border-primary" : "border-input"
                )}
              >
                <span className={data.birthday ? "text-foreground" : "text-muted-foreground"}>
                  {data.birthday ? format(data.birthday, 'MMMM d, yyyy') : 'Select their birthday'}
                </span>
                <CalendarIcon className="h-5 w-5 text-muted-foreground" />
              </button>
              
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
      
      {/* FOOTER - 6.25vh */}
      <div className="min-h-[6.25vh] bg-white flex items-center justify-between px-6 gap-3 shadow-[0_-2px_8px_rgba(0,0,0,0.1)] pb-safe-only">
        <img src={lunabeamIcon} alt="Lunabeam" className="h-16 w-16" />
        <div className="flex items-center gap-4 flex-1 justify-end">
          {currentStep > 1 && currentStep < 6 && (
            <BackButton onClick={handleBack} variant="text" />
          )}
          
          {currentStep < 6 && (
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
          
          {currentStep === 6 && (
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
