import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
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
  timing?: GoalOption;
  supports?: GoalOption[];
  startDate?: Date;
  dueDate?: Date;
  savedProgress?: WizardState;
}

const STEPS = [
  { id: 1, title: "Choose Category", subtitle: "What area would you like to work on?" },
  { id: 2, title: "Pick Goal", subtitle: "What specific goal interests you?" },
  { id: 3, title: "Why?", subtitle: "What's your main reason for this goal?" },
  { id: 4, title: "Details", subtitle: "How do you want to do this?" },
  { id: 5, title: "Amount", subtitle: "How much do you want to read?" },
  { id: 6, title: "Duration", subtitle: "How often?" },
  { id: 7, title: "Goal Timeline", subtitle: "When Will You Work on This Goal?" },
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
  const [showAmountDialog, setShowAmountDialog] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [customAmountType, setCustomAmountType] = useState<"pages" | "minutes">("minutes");
  const [isProcessingInput, setIsProcessingInput] = useState(false);
  const [isCreatingGoal, setIsCreatingGoal] = useState(false);
  
  const { toast } = useToast();

  // Clear any saved progress and start fresh
  useEffect(() => {
    localStorage.removeItem('goals-wizard-progress');
    setState({ step: 1 });
  }, []);

  const sanitizeGoalDescription = (text: string): string => {
    if (!text) return '';
    let out = text.trim();
    
    // Fix frequency patterns
    out = out.replace(/(\d+)x\/week/gi, '$1 times per week');
    
    // Fix double parentheses in support sections
    out = out.replace(/\.\s*\(with\s+([^,]+),\s*([^)]+)\s*\(([^)]+)\)\)/gi, '. With $1, $2 ($3)');
    out = out.replace(/\s*\(with\s+([^)]+)\)/gi, ' with $1');
    
    // Clean up extra spaces
    out = out.replace(/\s{2,}/g, ' ');
    
    return out;
  };


  const buildSmartGoal = () => {
    // Build a progressive SMART sentence that updates live
    const emoji = state.goal?.emoji ? `${state.goal.emoji} ` : "";
    const title = state.goal?.title ?? "";

    const detailsPart = state.details?.label;
    const amountPart = state.amount?.label;
    
    // Improved purpose suffix with better grammar
    const purposeSuffix = state.purpose?.label
      ? ` to ${state.purpose.label.toLowerCase().replace(/^(practice writing skills|express feelings\/journal|finish assignment|stay on top of schoolwork|balance school, chores, fun|reduce stress|practice math\/logic|build thinking skills|solve real-life challenge|prepare for test|remember lessons|improve grades|learn new things|build confidence|prepare for interview|improve answers|tidy room|feel calm|morning routine|make friends|practice skill|for school\/work|planning to move|learn about housing|help family|for college|for training|parent request|to relax|be social|improve focus|social connection|stay hydrated|boost mood)$/, (match) => {
          switch(match) {
            case 'practice writing skills': return 'practice writing skills';
            case 'express feelings/journal': return 'express feelings and journal';
            case 'finish assignment': return 'finish an assignment';
            case 'stay on top of schoolwork': return 'stay on top of schoolwork';
            case 'balance school, chores, fun': return 'balance school, chores, and fun';
            case 'reduce stress': return 'reduce stress';
            case 'practice math/logic': return 'practice math and logic';
            case 'build thinking skills': return 'build thinking skills';
            case 'solve real-life challenge': return 'solve a real-life challenge';
            case 'prepare for test': return 'prepare for a test';
            case 'remember lessons': return 'remember lessons';
            case 'improve grades': return 'improve grades';
            case 'learn new things': return 'learn new things';
            case 'build confidence': return 'build confidence';
            case 'prepare for interview': return 'prepare for an interview';
            case 'improve answers': return 'improve interview answers';
            case 'tidy room': return 'tidy my room';
            case 'feel calm': return 'feel calm';
            case 'morning routine': return 'establish a morning routine';
            case 'make friends': return 'make friends';
            case 'practice skill': return 'practice a skill';
            case 'for school/work': return 'for school or work';
            case 'planning to move': return 'plan a move';
            case 'learn about housing': return 'learn about housing';
            case 'help family': return 'help my family';
            case 'for college': return 'for college';
            case 'for training': return 'for training';
            case 'parent request': return 'help with a parent request';
            case 'to relax': return 'relax';
            case 'be social': return 'be social';
            case 'improve focus': return 'improve focus';
            case 'social connection': return 'build social connections';
            case 'stay hydrated': return 'stay hydrated';
            case 'boost mood': return 'boost my mood';
            default: return match;
          }
        })}`
      : "";

    // If nothing is chosen yet, return empty string to show helper text
    if (!title) return "";

    let sentence = `${emoji}`;

    // Handle different goal types with proper grammar
    if (state.goal?.id === 'read') {
      sentence += "Read ";
      
      if (amountPart) {
        sentence += `${amountPart}`;
      }
      
      if (detailsPart) {
        const d = detailsPart.toLowerCase();
        if (d === 'other') {
          sentence += amountPart ? '' : 'something';
        } else if (d.includes('read something') || d === 'something') {
          sentence += amountPart ? ' from something' : 'something';
        } else {
          const article = ['article', 'essay'].includes(d) ? 'an' : 'a';
          sentence += amountPart ? ` from ${article} ${d}` : `${article} ${d}`;
        }
      }
    } else {
      // For any other goals, use improved structure
      sentence += title.toLowerCase();
      
      if (detailsPart && !detailsPart.toLowerCase().includes('other')) {
        sentence += ` ${detailsPart.toLowerCase()}`;
      }
    }

    // Add timing if specified 
    if (state.timing?.label) {
      const timing = state.timing.label.toLowerCase();
      if (timing.includes('daily')) {
        sentence += ' daily';
      } else if (timing.includes('week')) {
        sentence += ` ${timing.replace('×', ' times')}`;
      } else {
        sentence += ` ${timing}`;
      }
    }

    // Handle due date if set
    if (state.dueDate) {
      sentence += ` by ${format(state.dueDate, 'MMM d, yyyy')}`;
    }

    sentence += purposeSuffix;

    return sentence;
  };

  const validateDates = (): string | null => {
    if (state.startDate && state.dueDate && state.startDate > state.dueDate) {
      return "Start date cannot be after due date";
    }
    return null;
  };

  const canProceed = () => {
    // Basic validation for each step
    switch (state.step) {
      case 1: return !!state.category;
      case 2: return !!state.goal;
      case 3: return !!state.purpose;
      case 4: return !state.goal?.details || !!state.details;
      case 5: return !state.goal?.amount || !!state.amount;
      case 6: return !state.goal?.timing || !!state.timing;
      case 7: return !!state.dueDate && !validateDates();
      case 8: return !!state.supports && state.supports.length > 0;
      default: return false;
    }
  };

  const createGoal = async () => {
    if (!state.goal || !state.purpose || !state.supports || !state.category || !state.startDate || !state.dueDate) {
      toast({
        title: "Missing information",
        description: "Please complete all required fields.",
        variant: "destructive",
      });
      return;
    }

    const dateValidationError = validateDates();
    if (dateValidationError) {
      toast({
        title: "Invalid dates",
        description: dateValidationError,
        variant: "destructive",
      });
      return;
    }

    setIsCreatingGoal(true);

    try {
      const formatDate = (date: Date) => format(date, 'yyyy-MM-dd');
      const startDate = state.startDate || new Date();
      const due = state.dueDate;

      // Create the goal
      const rawDescription = buildSmartGoal();
      const sanitizedDescription = sanitizeGoalDescription(rawDescription);
      
      const goal = await goalsService.createGoal({
        title: state.goal.title,
        description: sanitizedDescription,
        domain: mapCategoryToDomain(state.category.title),
        priority: 'medium',
        start_date: formatDate(startDate),
        due_date: formatDate(due),
      });

      // Generate milestone steps based on default duration
      try {
        const durationWeeks = 2; // Default to 2 weeks
        const totalSessions = durationWeeks * 3; // Default to 3 sessions per week
        
        const response = await AIService.getCoachingGuidance({
          question: `Generate ${totalSessions} milestone steps for this goal execution. Each step should represent one session/milestone of the goal being completed, NOT preparation tasks. Include the session number and make each step actionable:

Goal: ${state.goal.title}
Purpose: ${state.purpose.label}
Support: ${state.supports.map(s => s.label).join(', ')}

Return a JSON array of step objects with these properties:
- title: string (actionable title including session number)
- notes: string (brief explanation)
- points: number (1-3 based on difficulty)
- estimated_effort_min: number (estimated minutes)

Example:
[
  {"title": "Session 1: Complete first reading", "notes": "Focus on the introduction chapter", "points": 2, "estimated_effort_min": 30},
  {"title": "Session 2: Continue with chapter 2", "notes": "Take notes on key concepts", "points": 2, "estimated_effort_min": 30}
]`
        });

        if (response?.steps && Array.isArray(response.steps)) {
          // Create each step with due dates distributed evenly
          for (let i = 0; i < response.steps.length; i++) {
            const step = response.steps[i];
            
            // Calculate due date based on distribution
            const weekNumber = Math.floor(i / 3);
            const sessionInWeek = i % 3;
            
            // Distribute sessions across the week
            const daysPerSession = 7 / 3;
            const stepDueDate = new Date(startDate);
            stepDueDate.setDate(stepDueDate.getDate() + (weekNumber * 7) + (sessionInWeek * daysPerSession));
            
            await stepsService.createStep(goal.id, {
              title: step.title || `Step ${i + 1}`,
              notes: step.notes || '',
              points: step.points || 2,
              estimated_effort_min: step.estimated_effort_min || 30,
              due_date: formatDate(stepDueDate),
            });
          }
        } else {
          // Fallback: Create simple milestone steps
          const totalSessions = durationWeeks * 3;
          for (let i = 0; i < totalSessions; i++) {
            const weekNumber = Math.floor(i / 3) + 1;
            const sessionInWeek = (i % 3) + 1;
            
            const stepTitle = `Week ${weekNumber}, Session ${sessionInWeek}: ${state.goal.title}`;
            const weekDays = Math.floor(i / 3);
            const sessionDays = Math.round((i % 3) * (7 / 3)) + Math.round(7 / 3);
            const stepDueDate = new Date(startDate);
            stepDueDate.setDate(stepDueDate.getDate() + weekDays * 7 + sessionDays);
            
            await stepsService.createStep(goal.id, {
              title: stepTitle,
              notes: `Complete one session of ${state.goal.title.toLowerCase()}`,
              points: 2,
              estimated_effort_min: 30,
              due_date: formatDate(stepDueDate),
            });
          }
        }
        
        toast({
          title: "🎉 Goal Created!",
          description: `"${state.goal.title}" is ready to go with ${totalSessions} milestone steps!`,
          duration: 4000,
        });
      } catch (stepError) {
        console.error('Error creating steps:', stepError);
        toast({
          title: "Goal created",
          description: "Goal created successfully, but steps couldn't be generated. You can add them manually.",
          duration: 4000,
        });
      }

      // Clear saved progress
      localStorage.removeItem('goals-wizard-progress');
      
      // Reset state
      setState({ 
        step: 1,
        startDate: new Date()
      });
      
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      
      onComplete();
      
    } catch (error) {
      console.error('Error creating goal:', error);
      toast({
        title: "Error creating goal",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingGoal(false);
    }
  };

  const mapCategoryToDomain = (categoryTitle: string): GoalDomain => {
    switch (categoryTitle.toLowerCase()) {
      case 'health': return 'health';
      case 'school': return 'school';
      case 'work': return 'work';
      case 'life': return 'life';
      default: return 'other';
    }
  };

  const showRandomAffirmation = () => {
    const randomAffirmation = AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)];
    setAffirmation(randomAffirmation);
    setTimeout(() => setAffirmation(""), 3000);
  };

  const handleBack = () => {
    if (state.step > 1) {
      let prevStep = state.step - 1;

      // Skip steps that don't apply when going backwards
      if (prevStep === 6 && !state.goal?.timing) {
        prevStep = 5; // Skip timing step backwards
      }
      if (prevStep === 5 && !state.goal?.amount) {
        // If amount doesn't apply, jump back to details or purpose depending on goal
        prevStep = state.goal?.details ? 4 : 3;
      }
      if (prevStep === 4 && !state.goal?.details) {
        prevStep = 3;
      }

      setState(prev => ({ ...prev, step: prevStep }));
    } else {
      onBack();
    }
  };

  const handleNext = () => {
    if (canProceed()) {
      let nextStep = state.step + 1;
      
      // Skip steps that don't apply to this goal
      if (nextStep === 4 && !state.goal?.details) {
        nextStep = 5; // Skip details step
      }
      if (nextStep === 5 && !state.goal?.amount) {
        nextStep = 6; // Skip amount step
      }
      if (nextStep === 6 && !state.goal?.timing) {
        nextStep = 7; // Skip timing step
      }
      
      setState(prev => ({ ...prev, step: nextStep }));
      
      if (state.step >= 3) {
        showRandomAffirmation();
      }
    }
  };

  const handleCustomAmount = () => {
    if (!customAmount.trim()) return;

    const amount = parseInt(customAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid number.",
        variant: "destructive",
      });
      return;
    }

    const unit = customAmountType === "pages" ? (amount === 1 ? "page" : "pages") : "minutes";
    const displayLabel = `${amount} ${unit}`;

    const customAmountOption: GoalOption = {
      id: `custom-${customAmountType}-${amount}`,
      label: displayLabel,
      emoji: "📖",
      explainer: `Read for ${displayLabel}`
    };

    setState(prev => ({ ...prev, amount: customAmountOption, step: 6 }));
    showRandomAffirmation();
    setShowAmountDialog(false);
    setCustomAmount("");
    
    toast({
      title: "Perfect!",
      description: `Set to ${customAmountOption.label}.`,
      duration: 2000,
    });
  };


  // Calculate progress percentage
  const progress = (state.step / STEPS.length) * 100;

  return (
    <div className="max-w-2xl mx-auto p-4 bg-gradient-to-br from-background via-background/95 to-background/90 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          
          <div className="text-sm text-muted-foreground">
            Step {state.step} of {STEPS.length}
          </div>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
            Exit
          </Button>
        </div>
        
        <Progress value={progress} className="mb-4" />
        
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">
            {STEPS[state.step - 1]?.title}
          </h1>
          <p className="text-muted-foreground">
            {STEPS[state.step - 1]?.subtitle}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Step 1: Category Selection */}
        {state.step === 1 && (
          <CategorySelection
            onSelectCategory={(category) => {
              setState(prev => ({ ...prev, category, step: 2 }));
            }}
            onSelectDefault={(defaultState) => {
              setState(defaultState);
            }}
          />
        )}

        {/* Step 2: Goal Selection */}
        {state.step === 2 && state.category && (
          <GoalSelection
            category={state.category}
            onSelectGoal={(goal) => {
              setState(prev => ({ ...prev, goal, step: 3 }));
            }}
          />
        )}

        {/* Step 3: Purpose Selection */}
        {state.step === 3 && state.goal && (
          <OptionSelection
            title="Why?"
            options={state.goal.purpose}
            onSelect={(purpose) => {
              showRandomAffirmation();
            let nextStep = state.goal?.details ? 4 : (state.goal?.amount ? 5 : (state.goal?.timing ? 6 : 7));
              setState(prev => ({ ...prev, purpose, step: nextStep }));
            }}
            selected={state.purpose}
          />
        )}

        {/* Step 4: Details Selection (only if goal has details) */}
        {state.step === 4 && state.goal && state.goal.details && (
          <OptionSelection
            title="Details"
            options={state.goal.details}
            onSelect={(details) => {
              showRandomAffirmation();
              let nextStep = state.goal?.amount ? 5 : (state.goal?.timing ? 6 : 7);
              setState(prev => ({ ...prev, details, step: nextStep }));
            }}
            selected={state.details}
          />
        )}

        {/* Step 5: Amount Selection */}
        {state.step === 5 && state.goal && state.goal.amount && (
          <OptionSelection
            title="Amount"
            options={state.goal.amount}
            onSelect={(amount) => {
              showRandomAffirmation();
              let nextStep = state.goal?.timing ? 6 : 7;
              setState(prev => ({ ...prev, amount, step: nextStep }));
            }}
            selected={state.amount}
          />
        )}

        {/* Step 6: Duration/Timing Selection */}
        {state.step === 6 && state.goal && state.goal.timing && (
          <OptionSelection
            title="Duration"
            options={state.goal.timing}
            onSelect={(timing) => {
              showRandomAffirmation();
              setState(prev => ({ ...prev, timing, step: 7 }));
            }}
            selected={state.timing}
          />
        )}

        {/* Step 7: Due Date Selection */}
        {state.step === 7 && (
          <div className="space-y-6">
            <div className="max-w-md mx-auto space-y-6">
              {/* Date Selection Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full h-16 flex flex-col items-center justify-center gap-1 bg-muted/30 hover:bg-muted/50",
                          !state.startDate && "text-muted-foreground"
                        )}
                      >
                        {state.startDate ? (
                          <>
                            <span className="text-xs font-normal">
                              {format(state.startDate, "MMM")}
                            </span>
                            <span className="text-lg font-semibold">
                              {format(state.startDate, "d")}
                            </span>
                            <span className="text-xs font-normal">
                              {format(state.startDate, "yyyy")}
                            </span>
                          </>
                        ) : (
                          <>
                            <CalendarIcon className="h-4 w-4" />
                            <span className="text-xs">Select date</span>
                          </>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-gray-100" align="start">
                      <Calendar
                        mode="single"
                        selected={state.startDate}
                        onSelect={(date) => setState(prev => ({ ...prev, startDate: date || new Date() }))}
                        initialFocus
                        className="pointer-events-auto bg-gray-100 rounded-lg"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Due Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full h-16 flex flex-col items-center justify-center gap-1 bg-muted/30 hover:bg-muted/50",
                          !state.dueDate && "text-muted-foreground"
                        )}
                      >
                        {state.dueDate ? (
                          <>
                            <span className="text-xs font-normal">
                              {format(state.dueDate, "MMM")}
                            </span>
                            <span className="text-lg font-semibold">
                              {format(state.dueDate, "d")}
                            </span>
                            <span className="text-xs font-normal">
                              {format(state.dueDate, "yyyy")}
                            </span>
                          </>
                        ) : (
                          <>
                            <CalendarIcon className="h-4 w-4" />
                            <span className="text-xs">Select date</span>
                          </>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-gray-100" align="start">
                      <Calendar
                        mode="single"
                        selected={state.dueDate}
                        onSelect={(date) => setState(prev => ({ ...prev, dueDate: date }))}
                        initialFocus
                        className="pointer-events-auto bg-gray-100 rounded-lg"
                        disabled={(date) => {
                          if (!state.startDate) return false;
                          return date < state.startDate;
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {validateDates() && (
                <div className="text-red-500 text-sm text-center p-3 bg-red-50 rounded-lg border border-red-200">
                  {validateDates()}
                </div>
              )}

              <div className="flex justify-center pt-4">
                <Button 
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="px-8"
                >
                  Continue
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 8: Support Selection */}
        {state.step === 8 && state.goal && (
          <MultiOptionSelection
            title="Support"
            options={state.goal.supports}
            onSelect={(supports) => {
              showRandomAffirmation();
              setState(prev => ({ ...prev, supports, step: 9 }));
            }}
            selected={state.supports || []}
          />
        )}

        {/* Step 9: Confirmation */}
        {state.step === 9 && (
          <GoalConfirmation
            goal={buildSmartGoal()}
            startDate={state.startDate}
            dueDate={state.dueDate}
            onCreateGoal={createGoal}
            isCreating={isCreatingGoal}
            onBack={() => setState(prev => ({ ...prev, step: 8 }))}
          />
        )}
      </div>

    </div>
  );
};

// Reusable components
const CategorySelection: React.FC<{
  onSelectCategory: (category: Category) => void;
  onSelectDefault?: (state: WizardState) => void;
}> = ({ onSelectCategory, onSelectDefault }) => (
  <div className="space-y-6">
    {/* Starter Goals - Quick Start Section */}
    <div>
      <h3 className="text-lg font-semibold mb-3 text-center">🚀 Quick Start</h3>
      <div className="grid gap-3">
        {STARTER_GOALS.map((goal) => (
          <Card 
            key={goal.id}
            className="cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:border-primary/30"
            onClick={() => {
              // Auto-select this goal with defaults and go to due date step
              if (onSelectDefault) {
                onSelectDefault({ 
                  step: 7, // Go to due date step
                  category: { id: 'starter', title: 'Starter Goals', emoji: '🌟', description: 'Simple goals to get you started', goals: [goal] },
                  goal: goal,
                  purpose: goal.purpose.find(p => p.isDefault) || goal.purpose[0],
                  details: goal.details?.find(d => d.isDefault) || goal.details?.[0],
                  supports: [], // Let user choose supports
                  savedProgress: null
                });
              }
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{goal.emoji}</span>
                <div>
                  <h4 className="font-medium">{goal.title}</h4>
                  <p className="text-sm text-muted-foreground">{goal.explainer}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>

    {/* Regular Categories */}
    <div>
      <h3 className="text-lg font-semibold mb-3 text-center">🎯 All Categories</h3>
      <div className="grid gap-3">
        {GOALS_WIZARD_DATA.map((category) => (
          <Card 
            key={category.id}
            className="cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:border-primary/30"
            onClick={() => onSelectCategory(category)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{category.emoji}</span>
                <div>
                  <h4 className="font-medium">{category.title}</h4>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </div>
);

const GoalSelection: React.FC<{
  category: Category;
  onSelectGoal: (goal: CategoryGoal) => void;
}> = ({ category, onSelectGoal }) => (
  <div className="space-y-4">
    <div className="text-center">
      <h2 className="text-xl font-semibold mb-2">{category.emoji} {category.title}</h2>
      <p className="text-muted-foreground">Choose a goal that resonates with you</p>
    </div>
    <div className="grid gap-3">
      {category.goals.map((goal) => (
        <Card 
          key={goal.id}
          className="cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:border-primary/30"
          onClick={() => onSelectGoal(goal)}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-1">{goal.emoji}</span>
              <div>
                <h4 className="font-medium mb-1">{goal.title}</h4>
                <p className="text-sm text-muted-foreground">{goal.explainer}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

const OptionSelection: React.FC<{
  title: string;
  options: GoalOption[];
  onSelect: (option: GoalOption) => void;
  selected?: GoalOption;
}> = ({ title, options, onSelect, selected }) => (
  <div className="space-y-4">
    <div className="grid gap-3">
      {options.map((option) => (
        <Card 
          key={option.id}
          className={cn(
            "cursor-pointer transition-all duration-200 hover:scale-[1.02]",
            selected?.id === option.id 
              ? "border-primary bg-primary/5" 
              : "hover:border-primary/30"
          )}
          onClick={() => onSelect(option)}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <span className="text-xl mt-0.5">{option.emoji}</span>
              <div>
                <h4 className="font-medium mb-1">{option.label}</h4>
                <p className="text-sm text-muted-foreground">{option.explainer}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

const MultiOptionSelection: React.FC<{
  title: string;
  options: GoalOption[];
  onSelect: (options: GoalOption[]) => void;
  selected: GoalOption[];
}> = ({ title, options, onSelect, selected }) => {
  const toggleOption = (option: GoalOption) => {
    const isSelected = selected.some(s => s.id === option.id);
    if (isSelected) {
      onSelect(selected.filter(s => s.id !== option.id));
    } else {
      onSelect([...selected, option]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        {options.map((option) => (
          <Card 
            key={option.id}
            className={cn(
              "cursor-pointer transition-all duration-200 hover:scale-[1.02]",
              selected.some(s => s.id === option.id)
                ? "border-primary bg-primary/5" 
                : "hover:border-primary/30"
            )}
            onClick={() => toggleOption(option)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5">{option.emoji}</span>
                <div className="flex-1">
                  <h4 className="font-medium mb-1">{option.label}</h4>
                  <p className="text-sm text-muted-foreground">{option.explainer}</p>
                </div>
                {selected.some(s => s.id === option.id) && (
                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-xs text-primary-foreground">✓</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="flex justify-center">
        <Button 
          onClick={() => onSelect(selected)}
          disabled={selected.length === 0}
          className="px-8"
        >
          Continue with {selected.length} support{selected.length !== 1 ? 's' : ''}
        </Button>
      </div>
    </div>
  );
};

const GoalConfirmation: React.FC<{
  goal: string;
  startDate?: Date;
  dueDate?: Date;
  onCreateGoal: () => void;
  isCreating: boolean;
  onBack: () => void;
}> = ({ goal, startDate, dueDate, onCreateGoal, isCreating, onBack }) => (
  <div className="space-y-6">
    <div className="text-center">
      <h2 className="text-xl font-semibold mb-4">Ready to Start?</h2>
      <Card className="p-6 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-0">
          <p className="text-lg font-medium text-center mb-4">{goal}</p>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Start: {startDate ? format(startDate, 'MMM d, yyyy') : 'Today'}</span>
            <span>Complete by: {dueDate ? format(dueDate, 'MMM d, yyyy') : 'Not set'}</span>
          </div>
        </CardContent>
      </Card>
    </div>
    
    <div className="flex gap-3 justify-center">
      <Button 
        variant="outline" 
        onClick={onBack}
        disabled={isCreating}
      >
        Back
      </Button>
      <Button 
        onClick={onCreateGoal}
        disabled={isCreating}
        className="px-8"
      >
        {isCreating ? (
          <>
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
            Creating Goal...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Create Goal
          </>
        )}
      </Button>
    </div>
  </div>
);