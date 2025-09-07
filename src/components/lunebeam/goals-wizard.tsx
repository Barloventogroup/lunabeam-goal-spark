import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowLeft, X, Sparkles, Mic, Volume2, Users, MessageSquare, Send, CalendarIcon } from 'lucide-react';
import { GOALS_WIZARD_DATA, FALLBACK_OPTION, STARTER_GOALS, Category, CategoryGoal, GoalOption } from '@/data/goals-wizard-data';
import { useToast } from '@/hooks/use-toast';
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { 
  AccessibilityPanel, 
  ReEngagementPanel, 
  useVoiceInput, 
  useTextToSpeech, 
  ConfettiAnimation 
} from './accessibility-features';
import { AIService } from '@/services/aiService';
import { goalsService, stepsService } from '@/services/goalsService';
import type { GoalDomain } from '@/types';

interface GoalsWizardProps {
  onComplete: () => void;
  onBack: () => void;
}

interface WizardState {
  step: number;
  category?: Category;
  goal?: CategoryGoal;
  purpose?: GoalOption;
  details?: GoalOption;
  amount?: GoalOption;
  frequency?: GoalOption;
  duration?: GoalOption;
  supports?: GoalOption[];
  startDate?: Date;
  savedProgress?: WizardState;
}

const STEPS = [
  { id: 1, title: "Choose Category", subtitle: "What area would you like to work on?" },
  { id: 2, title: "Pick Goal", subtitle: "What specific goal interests you?" },
  { id: 3, title: "Why?", subtitle: "What's your main reason for this goal?" },
  { id: 4, title: "Details", subtitle: "How do you want to do this?" },
  { id: 5, title: "Amount", subtitle: "How much do you want to read?" },
  { id: 6, title: "How Often?", subtitle: "How frequently do you want to do this?" },
  { id: 7, title: "How Long?", subtitle: "For how many weeks?" },
  { id: 8, title: "Support", subtitle: "What would help you stick with it? (You can pick several!)" },
  { id: 9, title: "Confirm", subtitle: "Ready to start your goal?" }
];

const AFFIRMATIONS = [
  "Great choice! That'll keep you motivated!",
  "Perfect! Small steps lead to big changes.",
  "Nice! This will help you build a strong habit.",
  "Excellent! You're setting yourself up for success.",
  "Smart choice! This feels achievable and exciting.",
  "Wonderful! You're taking control of your growth."
];

export const GoalsWizard: React.FC<GoalsWizardProps> = ({ onComplete, onBack }) => {
  const [state, setState] = useState<WizardState>({ step: 1 });
  const [affirmation, setAffirmation] = useState<string>("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [showAmountDialog, setShowAmountDialog] = useState(false);
  const [showDurationDialog, setShowDurationDialog] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [customAmountType, setCustomAmountType] = useState<"pages" | "minutes">("minutes");
  const [customDuration, setCustomDuration] = useState("");
  const [customDurationType, setCustomDurationType] = useState<"weeks" | "days">("weeks");
  const [isProcessingInput, setIsProcessingInput] = useState(false);
  const [isCreatingGoal, setIsCreatingGoal] = useState(false);
  
  // Accessibility states
  const [isVoiceInputEnabled, setIsVoiceInputEnabled] = useState(false);
  const [isTextToSpeechEnabled, setIsTextToSpeechEnabled] = useState(false);
  const [isPeerModeEnabled, setIsPeerModeEnabled] = useState(false);
  
  // Re-engagement states
  const [currentStreak, setCurrentStreak] = useState(3);
  const [earnedBadges, setEarnedBadges] = useState(['🎯', '⭐']);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  
  const { toast } = useToast();
  const voiceInput = useVoiceInput();
  const textToSpeech = useTextToSpeech();

  // Load saved progress on mount only if step is 1 (fresh start)
  useEffect(() => {
    if (state.step === 1 && !state.category) {
      const saved = localStorage.getItem('goals-wizard-progress');
      if (saved) {
        try {
          const savedState = JSON.parse(saved);
          if (savedState.step > 1) {
            setState(prev => ({ ...prev, savedProgress: savedState }));
          }
        } catch (e) {
          console.error('Error loading saved progress:', e);
          localStorage.removeItem('goals-wizard-progress'); // Clear corrupted data
        }
      }
    }
  }, []); // Only run once on mount

  // Auto-save progress
  useEffect(() => {
    if (state.step > 1) {
      localStorage.setItem('goals-wizard-progress', JSON.stringify(state));
    }
  }, [state]);

  const showRandomAffirmation = () => {
    const randomAffirmation = AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)];
    setAffirmation(randomAffirmation);
    setTimeout(() => setAffirmation(""), 3000);
  };

  const handleBack = () => {
    if (state.step > 1) {
      setState(prev => ({ ...prev, step: prev.step - 1 }));
    } else {
      onBack();
    }
  };

  const handleExit = () => {
    // Save progress and exit
    if (state.step > 1) {
      toast({
        title: "Your progress is saved!",
        description: "You can pick up right where you left off next time.",
      });
    }
    onBack();
  };

  const buildSmartGoal = () => {
    // Build a progressive SMART sentence that updates live
    const emoji = state.goal?.emoji ? `${state.goal.emoji} ` : "";
    const title = state.goal?.title ?? "";

    const detailsPart = state.details?.label;
    const amountPart = state.amount?.label;
    const frequencyPart = state.frequency?.label;
    const durationPart = state.duration?.label;
    const purposeSuffix = state.purpose?.label
      ? ` to ${state.purpose.label.toLowerCase()}`
      : "";

    // If nothing is chosen yet, return empty string to show helper text
    if (!title) return "";

    let sentence = `${emoji}`;

    // Handle reading goals specially for better grammar
    if (state.goal?.id === 'read') {
      sentence += "Read ";
      
      if (amountPart) {
        sentence += `${amountPart}`;
      }
      
      if (detailsPart) {
        const d = detailsPart.toLowerCase();
        if (d === 'custom') {
          sentence += amountPart ? '' : 'something';
        } else if (d.includes('read something') || d === 'something') {
          sentence += amountPart ? ' from something' : 'something';
        } else {
          const article = ['article', 'essay'].includes(d) ? 'an' : 'a';
          sentence += amountPart ? ` from ${article} ${d}` : `${article} ${d}`;
        }
      }
    } else {
      // For non-reading goals, use the original structure
      sentence += title;
      
      if (detailsPart) {
        sentence += ` ${detailsPart}`;
      }
    }

    // Add timing information
    if (frequencyPart && durationPart) {
      // Fix singular/plural for duration
      let fixedDuration = durationPart;
      if (durationPart.includes('1 days')) {
        fixedDuration = durationPart.replace('1 days', '1 day');
      } else if (durationPart.includes('1 weeks')) {
        fixedDuration = durationPart.replace('1 weeks', '1 week');
      }
      
      sentence += `, ${frequencyPart} for ${fixedDuration}`;
    } else if (frequencyPart) {
      sentence += `, ${frequencyPart}`;
    } else if (durationPart) {
      let fixedDuration = durationPart;
      if (durationPart.includes('1 days')) {
        fixedDuration = durationPart.replace('1 days', '1 day');
      } else if (durationPart.includes('1 weeks')) {
        fixedDuration = durationPart.replace('1 weeks', '1 week');
      }
      sentence += ` for ${fixedDuration}`;
    }

    sentence += purposeSuffix ? `${purposeSuffix}.` : ".";

    if (state.supports?.length) {
      sentence += ` (with ${state.supports.map((s) => s.label).join(', ')})`;
    }

    return sentence;
  };

  const handleComplete = async () => {
    if (isCreatingGoal) return; // Prevent double-clicking
    
    if (!state.goal || !state.purpose || !state.details || !state.frequency || !state.duration || !state.supports || !state.category || !state.startDate) {
      if (!state.startDate) {
        toast({
          title: 'Almost there!',
          description: 'Just pick a start date and you\'re all set.',
          variant: 'destructive'
        });
      }
      return;
    }

    setIsCreatingGoal(true);

    // Show confetti animation (faster)
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 1500); // Reduced from 3000 to 1500

    try {
      const mapCategoryToDomain = (cat: string): GoalDomain => {
        switch (cat.toLowerCase()) {
          case 'education': return 'school';
          case 'employment': return 'work';
          case 'health': return 'health';
          case 'independent living':
          case 'social skills':
          default: return 'life';
        }
      };

      const formatDate = (d: Date) => d.toISOString().slice(0, 10);
      const startDate = state.startDate || new Date();
      const due = new Date(startDate);
      
      // Calculate due date based on duration
      const durationWeeks = parseInt(state.duration.label.split(' ')[0]) || 2;
      due.setDate(due.getDate() + (durationWeeks * 7));

      // Create the goal in Supabase
      const createdGoal = await goalsService.createGoal({
        title: state.goal.title,
        description: buildSmartGoal(),
        domain: mapCategoryToDomain(state.category.title),
        priority: 'medium',
        start_date: formatDate(startDate),
        due_date: formatDate(due),
      });

      // Generate and create milestone steps based on goal frequency and duration
      try {
        const frequencyNum = parseInt(state.frequency.label.split('×')[0]) || 1;
        const durationWeeks = parseInt(state.duration.label.split(' ')[0]) || 2;
        const totalSessions = frequencyNum * durationWeeks;
        
        const response = await AIService.getCoachingGuidance({
          question: `Generate ${totalSessions} milestone steps for this goal execution. Each step should represent one session/milestone of the goal being completed, NOT preparation tasks. Include the session number and make each step actionable:

Goal: ${state.goal.title}  
Description: ${buildSmartGoal()}
Frequency: ${state.frequency.label} (${frequencyNum} times per week)
Duration: ${state.duration.label} (${durationWeeks} weeks)
Total Sessions: ${totalSessions}

Return exactly ${totalSessions} milestone steps, each representing one execution session. Format like "Week 1: Complete first 20-minute walk session" or "Session 2: Walk 20 minutes with playlist". Each step should be a specific milestone completion, not preparation.`,
          mode: 'goal_setting'
        });

        if (response?.suggestions) {
          const steps = response.suggestions.split('\n')
            .filter((step: string) => step.trim())
            .slice(0, totalSessions)
            .map((step: string) => step.replace(/^\d+\.\s*/, '').trim());
          
          // Create milestone steps with calculated due dates
          for (let i = 0; i < steps.length; i++) {
            const stepTitle = steps[i];
            
            // Calculate due date based on frequency distribution
            const weekNumber = Math.floor(i / frequencyNum);
            const sessionInWeek = i % frequencyNum;
            
            // Distribute sessions evenly across the week
            const daysPerSession = 7 / frequencyNum;
            const dayOffset = weekNumber * 7 + Math.round(sessionInWeek * daysPerSession + daysPerSession);
            
            const stepDueDate = new Date(startDate);
            stepDueDate.setDate(stepDueDate.getDate() + dayOffset);
            
            await stepsService.createStep(createdGoal.id, {
              title: stepTitle,
              is_required: true,
              due_date: formatDate(stepDueDate),
            });
          }
        }
      } catch (error) {
        console.error('Error generating milestone steps:', error);
        // Create fallback milestone steps if AI fails
        const frequencyNum = parseInt(state.frequency.label.split('×')[0]) || 1;
        const durationWeeks = parseInt(state.duration.label.split(' ')[0]) || 2;
        const totalSessions = frequencyNum * durationWeeks;
        
        for (let i = 0; i < totalSessions; i++) {
          const weekNumber = Math.floor(i / frequencyNum) + 1;
          const sessionInWeek = (i % frequencyNum) + 1;
          
          // Calculate due date
          const weekDays = Math.floor(i / frequencyNum);
          const sessionDays = Math.round((i % frequencyNum) * (7 / frequencyNum)) + Math.round(7 / frequencyNum);
          const dayOffset = weekDays * 7 + sessionDays;
          
          const stepDueDate = new Date(startDate);
          stepDueDate.setDate(stepDueDate.getDate() + dayOffset);
          
          await stepsService.createStep(createdGoal.id, {
            title: `Week ${weekNumber}, Session ${sessionInWeek}: ${state.goal.title}`,
            is_required: true,
            due_date: formatDate(stepDueDate),
          });
        }
      }

      toast({
        title: 'Goal Created! 🎉',
        description: `Your ${state.goal.title} is ready to go!`,
        duration: 2000, // Auto-clear after 2 seconds
      });

      // Clear saved progress
      localStorage.removeItem('goals-wizard-progress');
      
      onComplete();
    } catch (error) {
      console.error('Error creating goal:', error);
      toast({
        title: 'Oops!',
        description: 'Something went wrong creating your goal. Let\'s try again!',
        variant: 'destructive'
      });
    } finally {
      setIsCreatingGoal(false);
    }
  };

  const handleResumeSaved = () => {
    if (state.savedProgress) {
      setState(state.savedProgress);
    }
  };

  const handleStartFresh = () => {
    localStorage.removeItem('goals-wizard-progress');
    setState({ 
      step: 1,
      category: undefined,
      goal: undefined,
      purpose: undefined,
      details: undefined,
      frequency: undefined,
      duration: undefined,
      supports: [],
      startDate: undefined,
      savedProgress: null
    });
  };

  const handleCustomInput = async () => {
    if (!customInput.trim()) return;
    
    setIsProcessingInput(true);
    
    try {
      const response = await AIService.getCoachingGuidance({
        question: customInput,
        mode: 'assist',
        context: `User is creating a goal. Current progress: ${buildSmartGoal() || 'Starting new goal'}`,
        userSnapshot: {},
        currentGoals: []
      });

      if (response?.guidance) {
        // Parse the AI response and update the goal
        // For now, we'll add it as a custom purpose or detail
        let customOption: GoalOption = {
          id: 'custom-' + Date.now(),
          label: customInput.slice(0, 50) + (customInput.length > 50 ? '...' : ''),
          emoji: '✨',
          explainer: response.guidance
        };

        // Apply validation for "Read Something" goal
        if (state.goal?.id === 'read') {
          if (state.step === 3 && customInput.toLowerCase().includes("don't know")) {
            customOption = {
              ...customOption,
              label: "read something for fun",
              explainer: "Reading for enjoyment and fun"
            };
          } else if (state.step === 4 && customInput.toLowerCase().includes("don't know")) {
            customOption = {
              ...customOption,
              label: "read something",
              explainer: "Start reading anything - you'll discover what interests you"
            };
          }
        }

        // Determine where to add the custom input based on current step
        if (state.step === 3 && !state.purpose) {
          setState(prev => ({ ...prev, purpose: customOption, step: 4 }));
        } else if (state.step === 4 && !state.details) {
          const nextStep = state.goal?.id === 'read' && state.goal?.amount ? 5 : 6;
          setState(prev => ({ ...prev, details: customOption, step: nextStep }));
        } else if (state.step === 5 && state.goal?.id === 'read' && !state.amount) {
          setState(prev => ({ ...prev, amount: customOption, step: 6 }));
        } else if (state.step === 6 && !state.frequency) {
          setState(prev => ({ ...prev, frequency: customOption, step: 7 }));
        } else if (state.step === 7 && !state.duration) {
          setState(prev => ({ ...prev, duration: customOption, step: 8 }));
        }

        showRandomAffirmation();
        setShowCustomDialog(false);
        setCustomInput("");
        
        // Show encouraging message for "I don't know" responses
        let toastMessage = "Your input has been added to your goal.";
        if (state.goal?.id === 'read' && customInput.toLowerCase().includes("don't know")) {
          if (state.step === 3) {
            toastMessage = "Let's read something for fun!";
          } else if (state.step === 4) {
            toastMessage = "I don't worry you don't need to know know. Read something, you'll let me know what afterwards. You can do it!";
          }
        }
        
        toast({
          title: "Got it!",
          description: toastMessage,
          duration: 2000, // Auto-clear after 2 seconds
        });
      }
    } catch (error) {
      console.error('Error processing custom input:', error);
      toast({
        title: "Hmm, that didn't work",
        description: "Try again or pick from the options above.",
        variant: "destructive"
      });
    } finally {
      setIsProcessingInput(false);
    }
  };

  const handleCustomAmount = () => {
    if (!customAmount.trim()) return;
    
    const amount = parseInt(customAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid number.",
        variant: "destructive"
      });
      return;
    }

    const customAmountOption: GoalOption = {
      id: `custom-${customAmountType}-${amount}`,
      label: `${amount} ${customAmountType}`,
      emoji: customAmountType === "minutes" ? "⏰" : "📄",
      explainer: `Read for ${amount} ${customAmountType}`
    };

    setState(prev => ({ ...prev, amount: customAmountOption, step: 6 }));
    showRandomAffirmation();
    setShowAmountDialog(false);
    setCustomAmount("");
    
    toast({
      title: "Perfect!",
      description: `Set to ${amount} ${customAmountType}.`,
      duration: 2000, // Auto-clear after 2 seconds
    });
  };

  const handleCustomDuration = () => {
    if (!customDuration.trim()) return;
    
    const duration = parseInt(customDuration);
    if (isNaN(duration) || duration <= 0) {
      toast({
        title: "Invalid duration",
        description: "Please enter a valid number.",
        variant: "destructive"
      });
      return;
    }

    const customDurationOption: GoalOption = {
      id: `custom-${customDurationType}-${duration}`,
      label: `${duration} ${customDurationType}`,
      emoji: "📅",
      explainer: `Continue for ${duration} ${customDurationType}`
    };

    setState(prev => ({ ...prev, duration: customDurationOption, step: 8 }));
    showRandomAffirmation();
    setShowDurationDialog(false);
    setCustomDuration("");
    
    toast({
      title: "Perfect!",
      description: `Set to ${duration} ${customDurationType}.`,
      duration: 2000, // Auto-clear after 2 seconds
    });
  };

  // Show resume dialog if we have saved progress
  if (state.savedProgress && state.step === 1) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center space-y-4">
            <div className="text-4xl mb-4">🎯</div>
            <h2 className="text-xl font-bold">Welcome back!</h2>
            <p className="text-foreground-soft">
              We saved your goal progress. Do you want to continue where you left off?
            </p>
            <div className="space-y-2">
              <Button onClick={handleResumeSaved} className="w-full">
                Continue where I left off
              </Button>
              <Button onClick={handleStartFresh} variant="outline" className="w-full">
                Start fresh
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur border-b z-40">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex flex-col">
            <div className="text-sm font-medium text-center mb-1">
              Step {state.step} of {STEPS.length}
            </div>
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={state.step === 1 ? onBack : handleBack}
                className="p-2 flex items-center justify-center"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex-1 mx-4">
                <Progress value={(state.step / STEPS.length) * 100} className="w-full" />
              </div>
              
              {/* Exit Button - Available on all steps */}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleExit}
                className="p-2 flex items-center justify-center"
                title="Exit wizard"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto p-4 pb-8">{/* Reduced bottom padding for category selection */}
        <div className="space-y-6">
          {/* Question */}
          <div className="text-center space-y-2">
            <h1>
              {STEPS[state.step - 1]?.title}
            </h1>
            <p className="text-body-sm text-foreground-soft">
              {STEPS[state.step - 1]?.subtitle}
            </p>
          </div>

          {/* Step Content */}
          {state.step === 1 && (
            <CategorySelection 
              onSelect={(category) => {
                showRandomAffirmation();
                setState(prev => ({ ...prev, category, step: 2 }));
              }}
              onSelectDefault={(defaultState) => setState(defaultState)}
            />
          )}

          {state.step === 2 && state.category && (
            <GoalSelection 
              category={state.category}
              onSelect={(goal) => {
                showRandomAffirmation();
                setState(prev => ({ ...prev, goal, step: 3 }));
              }}
            />
          )}

          {/* Custom Input Dialog */}
          <Dialog open={showCustomDialog} onOpenChange={setShowCustomDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Tell us more about your goal</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Textarea
                  placeholder="Describe what you want to work on in your own words..."
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  className="min-h-[100px]"
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={handleCustomInput}
                    disabled={!customInput.trim() || isProcessingInput}
                    className="flex-1"
                  >
                    {isProcessingInput ? (
                      "Processing..."
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Add to goal
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCustomDialog(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Custom Amount Dialog */}
          <Dialog open={showAmountDialog} onOpenChange={setShowAmountDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Custom Reading Amount</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Enter number"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="flex-1 px-3 py-2 border border-input rounded-md text-sm"
                      min="1"
                    />
                    <select
                      value={customAmountType}
                      onChange={(e) => setCustomAmountType(e.target.value as "pages" | "minutes")}
                      className="px-3 py-2 border border-input rounded-md text-sm"
                    >
                      <option value="minutes">minutes</option>
                      <option value="pages">pages</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleCustomAmount}
                    disabled={!customAmount.trim()}
                    className="flex-1"
                  >
                    Set Amount
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAmountDialog(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Custom Duration Dialog */}
          <Dialog open={showDurationDialog} onOpenChange={setShowDurationDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Custom Duration</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">How long?</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Enter number"
                      value={customDuration}
                      onChange={(e) => setCustomDuration(e.target.value)}
                      className="flex-1 px-3 py-2 border border-input rounded-md text-sm"
                      min="1"
                    />
                    <select
                      value={customDurationType}
                      onChange={(e) => setCustomDurationType(e.target.value as "weeks" | "days")}
                      className="px-3 py-2 border border-input rounded-md text-sm"
                    >
                      <option value="weeks">weeks</option>
                      <option value="days">days</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleCustomDuration}
                    disabled={!customDuration.trim()}
                    className="flex-1"
                  >
                    Set Duration
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowDurationDialog(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {state.step === 3 && state.goal && (
            <OptionSelection
              title="Purpose"
              options={state.goal.purpose}
              onSelect={(purpose) => {
                if (purpose.id === 'other') {
                  setShowCustomDialog(true);
                  return;
                }
                showRandomAffirmation();
                setState(prev => ({ ...prev, purpose, step: 4 }));
              }}
              selected={state.purpose}
              showCustomInput={state.goal?.id !== 'read' ? () => setShowCustomDialog(true) : undefined}
            />
          )}

          {state.step === 4 && state.goal && (
            <OptionSelection
              title="Details"
              options={state.goal.details}
              onSelect={(details) => {
                if (details.id === 'other') {
                  setShowCustomDialog(true);
                  return;
                }
                showRandomAffirmation();
                // Check if this is a reading goal and has amount options
                const nextStep = state.goal?.id === 'read' && state.goal?.amount ? 5 : 6;
                setState(prev => ({ ...prev, details, step: nextStep }));
              }}
              selected={state.details}
            />
          )}

          {state.step === 5 && state.goal?.id === 'read' && state.goal.amount && (
            <OptionSelection
              title="Amount"
              options={state.goal.amount}
              onSelect={(amount) => {
                showRandomAffirmation();
                setState(prev => ({ ...prev, amount, step: 6 }));
              }}
              selected={state.amount}
              showCustomInput={() => setShowAmountDialog(true)}
            />
          )}

          {state.step === 6 && state.goal && (
            <FrequencySelection
              onSelect={(frequency) => {
                showRandomAffirmation();
                setState(prev => ({ ...prev, frequency, step: 7 }));
              }}
              selected={state.frequency}
              showCustomInput={() => setShowCustomDialog(true)}
            />
          )}

          {state.step === 7 && state.goal && (
            <OptionSelection
              title="How Long?"
              options={state.goal.timing}
              onSelect={(duration) => {
                showRandomAffirmation();
                setState(prev => ({ ...prev, duration, step: 8 }));
              }}
              selected={state.duration}
              showCustomInput={() => setShowDurationDialog(true)}
            />
          )}

          {state.step === 8 && state.goal && (
            <div className="space-y-6">
              <MultiOptionSelection
                title="Support"
                options={state.goal.supports}
                onSelect={(supports) => {
                  setState(prev => ({ ...prev, supports }));
                }}
                selected={state.supports || []}
              />
              
              {/* Continue Button for Support Step */}
              <div className="pt-4">
                <Button 
                  onClick={() => {
                    showRandomAffirmation();
                    setState(prev => ({ ...prev, step: 9 }));
                  }}
                  className="w-full"
                  size="lg"
                >
                  Continue to Final Step
                </Button>
              </div>
            </div>
          )}

          {state.step === 9 && (
            <GoalConfirmation
              smartGoal={buildSmartGoal()}
              startDate={state.startDate}
              onStartDateChange={(date) => setState(prev => ({ ...prev, startDate: date }))}
              onComplete={handleComplete}
              onEdit={() => setState(prev => ({ ...prev, step: 3 }))}
              isCreating={isCreatingGoal}
            />
          )}
        </div>
      </div>

      {/* Enhanced Confetti */}
      {showConfetti && <ConfettiAnimation />}

      {/* Footer - only show when step > 2 AND not on category selection */}
      {state.step < 8 && state.step > 2 && (
        <div className="fixed bottom-16 left-0 right-0 bg-background/95 backdrop-blur border-t z-40">
          <div className="max-w-md mx-auto p-4 space-y-3">
            {/* SMART Preview */}
            {state.step > 2 && (
              <div className="bg-primary/10 rounded-lg p-3">
                <div className="text-sm font-medium text-primary mb-1">Your goal so far:</div>
                <div className="text-sm text-foreground">
                  {buildSmartGoal() || "Building your personalized goal..."}
                </div>
              </div>
            )}

            {/* Affirmation */}
            {affirmation && (
              <div className="text-center text-sm text-primary font-medium animate-fade-in">
                {affirmation}
              </div>
            )}

            {/* Review Goal Button for Supports Step */}
            {state.step === 7 && (
              <Button 
                onClick={() => {
                  showRandomAffirmation();
                  setState(prev => ({ ...prev, step: 8 }));
                }}
                className="w-full"
                size="lg"
              >
                Review your goal
                <Sparkles className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Category Selection Component
const CategorySelection: React.FC<{
  onSelect: (category: Category) => void;
  onSelectDefault?: (defaults: WizardState) => void;
}> = ({ onSelect, onSelectDefault }) => {
  const [showStarterGoals, setShowStarterGoals] = useState(false);

  if (showStarterGoals) {
    return (
      <div className="space-y-3">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold">Here are some simple starter goals:</h3>
          <p className="text-sm text-foreground-soft">Pick one to get started!</p>
        </div>
        
        {STARTER_GOALS.map((goal) => (
          <Card 
            key={goal.id}
            className="cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:border-primary/30"
            onClick={() => {
              // Auto-select this goal with defaults and go to timing step
              if (onSelectDefault) {
                onSelectDefault({ 
                  step: 5, // Go to frequency step
                  category: { id: 'starter', title: 'Starter Goals', emoji: '🌟', goals: [goal] },
                  goal: goal,
                  purpose: goal.purpose.find(p => p.isDefault) || goal.purpose[0],
                  details: goal.details.find(d => d.isDefault) || goal.details[0],
                  frequency: undefined, // Let user choose frequency
                  supports: [], // Let user choose supports
                  savedProgress: null
                });
              }
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="text-2xl">{goal.emoji}</div>
                <div className="flex-1">
                  <div className="font-semibold text-foreground mb-1">{goal.title}</div>
                  <div className="text-sm text-foreground-soft">
                    {goal.explainer}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        <Button 
          variant="outline" 
          onClick={() => setShowStarterGoals(false)}
          className="w-full mt-4"
        >
          ← Back to categories
        </Button>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {GOALS_WIZARD_DATA.map((category) => (
        <Card 
          key={category.id}
          className="cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:border-primary/50"
          onClick={() => onSelect(category)}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl">{category.emoji}</div>
              <div className="flex-1">
                <div className="font-semibold text-foreground mb-1">{category.title}</div>
                <div className="text-sm text-foreground-soft">
                  These are all about {category.title.toLowerCase()} - pick whatever feels doable right now!
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {/* Fallback Option */}
      <Card 
        className="cursor-pointer transition-all duration-200 hover:scale-[1.02] border-dashed hover:border-primary/50"
        onClick={() => setShowStarterGoals(true)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">{FALLBACK_OPTION.emoji}</div>
            <div className="flex-1">
              <div className="font-semibold text-foreground mb-1">{FALLBACK_OPTION.label}</div>
              <div className="text-sm text-foreground-soft">
                {FALLBACK_OPTION.explainer}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Goal Selection Component
const GoalSelection: React.FC<{
  category: Category;
  onSelect: (goal: CategoryGoal) => void;
}> = ({ category, onSelect }) => {
  return (
    <div className="space-y-3">
      {category.goals.map((goal) => (
        <Card 
          key={goal.id}
          className="cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:border-primary/50"
          onClick={() => onSelect(goal)}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl">{goal.emoji}</div>
              <div className="flex-1">
                <div className="font-semibold text-foreground mb-1">{goal.title}</div>
                <div className="text-sm text-foreground-soft">
                  {goal.explainer}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Option Selection Component (for single choice)
const OptionSelection: React.FC<{
  title: string;
  options: GoalOption[];
  onSelect: (option: GoalOption) => void;
  selected?: GoalOption;
  allowFallback?: boolean;
  showCustomInput?: () => void;
}> = ({ title, options, onSelect, selected, allowFallback, showCustomInput }) => {
  return (
    <div className="space-y-3">
      {options.map((option) => (
        <Card 
          key={option.id}
          className={`cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
            selected?.id === option.id 
              ? 'border-primary bg-primary/5' 
              : 'hover:border-primary/30'
          }`}
          onClick={() => onSelect(option)}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="text-xl">{option.emoji}</div>
              <div className="font-medium text-foreground">{option.label}</div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Custom Input Option */}
      {showCustomInput && (
        <Card 
          className="cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:border-primary/30 border-dashed"
          onClick={showCustomInput}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="text-xl">💬</div>
              <div className="font-medium text-foreground">Other</div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Fallback Option */}
      {allowFallback && (
        <Card 
          className="cursor-pointer transition-all duration-200 hover:scale-[1.02] border-dashed hover:border-primary/30"
          onClick={() => {
            // Fallback behavior
            if (title === "Timing") {
              // Use easy-start defaults if not present in options
              const defaultTiming: GoalOption =
                options.find(o => /1×\/week/.test(o.label) && /2 weeks/.test(o.label)) || {
                  id: "1week-2weeks",
                  label: "1×/week for 2 weeks",
                  emoji: "📅",
                  explainer: "Once per week for two weeks",
                  isDefault: true
                };
              onSelect(defaultTiming);
              return;
            }

            // Otherwise, auto-select default or first option
            const defaultOption = options.find(o => o.isDefault) || options[0];
            onSelect(defaultOption);
          }}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="text-xl">{FALLBACK_OPTION.emoji}</div>
              <div>
                <div className="font-semibold text-foreground">{FALLBACK_OPTION.label}</div>
                <div className="text-xs text-foreground-soft mt-1">
                  {title === "Timing" 
                    ? "Small steps count — let's start once a week." 
                    : `We'll start small: ${(options.find(o => o.isDefault) || options[0]).label}.`}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Multi-Option Selection Component (for supports)
const MultiOptionSelection: React.FC<{
  title: string;
  options: GoalOption[];
  onSelect: (options: GoalOption[]) => void;
  selected: GoalOption[];
}> = ({ options, onSelect, selected }) => {
  const handleToggle = (option: GoalOption) => {
    const isSelected = selected.some(s => s.id === option.id);
    if (isSelected) {
      onSelect(selected.filter(s => s.id !== option.id));
    } else {
      onSelect([...selected, option]);
    }
  };

  return (
    <div className="space-y-3">
      {options.map((option) => (
        <Card 
          key={option.id}
          className={`cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
            selected.some(s => s.id === option.id)
              ? 'border-primary bg-primary/5' 
              : 'hover:border-primary/30'
          }`}
          onClick={() => handleToggle(option)}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="text-xl">{option.emoji}</div>
              <div className="font-semibold text-foreground">{option.label}</div>
              {option.isDefault && (
                <div className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                  Recommended
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
      
      {/* Auto-select defaults if none selected */}
      {selected.length === 0 && (
        <Card 
          className="cursor-pointer transition-all duration-200 hover:scale-[1.02] border-dashed hover:border-primary/30"
          onClick={() => {
            // Prefer Reminder + Checklist as defaults
            const reminder = options.find(o => /reminder/i.test(o.label));
            const checklist = options.find(o => /checklist/i.test(o.label));
            const preferred = [reminder, checklist].filter(Boolean) as GoalOption[];

            if (preferred.length > 0) {
              onSelect(preferred);
              return;
            }

            // Fallback to options marked as default, otherwise first option
            const defaults = options.filter(o => o.isDefault);
            onSelect(defaults.length > 0 ? defaults : [options[0]]);
          }}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="text-xl">{FALLBACK_OPTION.emoji}</div>
              <div className="font-semibold text-foreground">Use recommended supports</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Goal Confirmation Component
const GoalConfirmation: React.FC<{
  smartGoal: string;
  startDate?: Date;
  onStartDateChange: (date: Date | undefined) => void;
  onComplete: () => void;
  onEdit: () => void;
  isCreating?: boolean;
}> = ({ smartGoal, startDate, onStartDateChange, onComplete, onEdit, isCreating = false }) => {
  return (
    <div className="text-center space-y-6">
      <div className="text-6xl animate-bounce">🎉</div>
      
      <div className="space-y-4">
        <h3>
          Fantastic! Your goal is ready!
        </h3>
        
        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <CardContent className="p-4">
            <h5 className="mb-2">Your SMART Goal:</h5>
            <div className="text-body">{smartGoal}</div>
          </CardContent>
        </Card>

        {/* Start Date Picker */}
        <Card>
          <CardContent className="p-4">
            <h6 className="mb-3">When would you like to start? <span className="text-destructive">*</span></h6>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground border-destructive"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : <span>Pick a start date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-50 bg-background border shadow-lg" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={onStartDateChange}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </CardContent>
        </Card>
        
        <p className="text-body-sm text-foreground-soft">
          You're all set to start making positive changes! 
          Remember, small consistent steps lead to big results.
        </p>
      </div>
      
      <div className="space-y-3">
        <Button 
          onClick={onComplete} 
          className="w-full" 
          size="lg"
          disabled={!startDate || isCreating}
        >
          {isCreating ? 'Creating Your Goal...' : 'Start My Goal!'}
          {isCreating ? (
            <div className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <Sparkles className="ml-2 h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
};

// Frequency Selection Component
const FrequencySelection: React.FC<{
  onSelect: (frequency: GoalOption) => void;
  selected?: GoalOption;
  showCustomInput?: () => void;
}> = ({ onSelect, selected, showCustomInput }) => {
  const frequencyOptions: GoalOption[] = [
    { id: "1x-week", label: "1×/week", emoji: "📅", explainer: "Once per week" },
    { id: "2x-week", label: "2×/week", emoji: "📅", explainer: "Twice per week" },
    { id: "3x-week", label: "3×/week", emoji: "📅", explainer: "Three times per week", isDefault: true },
    { id: "daily", label: "Daily", emoji: "📅", explainer: "Every day" }
  ];

  return (
    <div className="space-y-3">
      {frequencyOptions.map((option) => (
        <Card 
          key={option.id}
          className={`cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
            selected?.id === option.id 
              ? 'border-primary bg-primary/5' 
              : 'hover:border-primary/30'
          }`}
          onClick={() => onSelect(option)}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="text-xl">{option.emoji}</div>
              <div className="font-medium text-foreground">{option.label}</div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Custom Input Option */}
      {showCustomInput && (
        <Card 
          className="cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:border-primary/30 border-dashed"
          onClick={showCustomInput}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="text-xl">💬</div>
              <div className="font-medium text-foreground">Other</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Duration Selection Component
const DurationSelection: React.FC<{
  onSelect: (duration: GoalOption) => void;
  selected?: GoalOption;
  showCustomInput?: () => void;
}> = ({ onSelect, selected, showCustomInput }) => {
  const durationOptions: GoalOption[] = [
    { id: "2-weeks", label: "2 weeks", emoji: "📅", explainer: "For 2 weeks", isDefault: true },
    { id: "3-weeks", label: "3 weeks", emoji: "📅", explainer: "For 3 weeks" },
    { id: "4-weeks", label: "4 weeks", emoji: "📅", explainer: "For 4 weeks" }
  ];

  return (
    <div className="space-y-3">
      {durationOptions.map((option) => (
        <Card 
          key={option.id}
          className={`cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
            selected?.id === option.id 
              ? 'border-primary bg-primary/5' 
              : 'hover:border-primary/30'
          }`}
          onClick={() => onSelect(option)}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="text-xl">{option.emoji}</div>
              <div className="font-medium text-foreground">{option.label}</div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Custom Input Option */}
      {showCustomInput && (
        <Card 
          className="cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:border-primary/30 border-dashed"
          onClick={showCustomInput}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="text-xl">💬</div>
              <div className="font-medium text-foreground">Other</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
