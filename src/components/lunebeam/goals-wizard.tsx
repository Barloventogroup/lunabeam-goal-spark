import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, X, Sparkles, Mic, Volume2, Users } from 'lucide-react';
import { GOALS_WIZARD_DATA, FALLBACK_OPTION, STARTER_GOALS, Category, CategoryGoal, GoalOption } from '@/data/goals-wizard-data';
import { useToast } from '@/hooks/use-toast';
import { 
  AccessibilityPanel, 
  ReEngagementPanel, 
  useVoiceInput, 
  useTextToSpeech, 
  ConfettiAnimation 
} from './accessibility-features';

interface GoalsWizardProps {
  onComplete: (goalData: {
    category: string;
    goal: string;
    purpose: string;
    details: string;
    timing: string;
    supports: string[];
    smartGoal: string;
  }) => void;
  onBack: () => void;
}

interface WizardState {
  step: number;
  category?: Category;
  goal?: CategoryGoal;
  purpose?: GoalOption;
  details?: GoalOption;
  timing?: GoalOption;
  supports?: GoalOption[];
  savedProgress?: WizardState;
}

const STEPS = [
  { id: 1, title: "Choose Category", subtitle: "What area would you like to work on?" },
  { id: 2, title: "Pick Goal", subtitle: "What specific goal interests you?" },
  { id: 3, title: "Why?", subtitle: "What's your main reason for this goal?" },
  { id: 4, title: "Details", subtitle: "How do you want to do this?" },
  { id: 5, title: "When?", subtitle: "How often and for how long?" },
  { id: 6, title: "Support", subtitle: "What would help you stick with it? (You can pick several!)" },
  { id: 7, title: "Confirm", subtitle: "Ready to start your goal?" }
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
        title: "Progress saved!",
        description: "You can continue where you left off next time.",
      });
    }
    onBack();
  };

  const buildSmartGoal = () => {
    // Build a progressive SMART sentence that updates live
    const emoji = state.goal?.emoji ? `${state.goal.emoji} ` : "";
    const title = state.goal?.title ?? "";

    const detailsPart = state.details?.label;
    const timingPart = state.timing?.label;
    const purposeSuffix = state.purpose?.label
      ? ` to ${state.purpose.label.toLowerCase()}`
      : "";

    // If nothing is chosen yet, return empty string to show helper text
    if (!title) return "";

    let sentence = `${emoji}${title}`;

    if (detailsPart && timingPart) {
      sentence += ` ${detailsPart}, ${timingPart}`;
    } else if (detailsPart) {
      sentence += ` ${detailsPart}`;
    } else if (timingPart) {
      sentence += ` ${timingPart}`;
    }

    sentence += purposeSuffix ? `${purposeSuffix}.` : ".";

    if (state.supports?.length) {
      sentence += ` (with ${state.supports.map((s) => s.label).join(', ')})`;
    }

    return sentence;
  };

  const handleComplete = () => {
    if (!state.goal || !state.purpose || !state.details || !state.timing || !state.supports || !state.category) return;

    // Show confetti animation
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);

    const goalData = {
      category: state.category.title,
      goal: state.goal.title,
      purpose: state.purpose.label,
      details: state.details.label,
      timing: state.timing.label,
      supports: state.supports.map(s => s.label),
      smartGoal: buildSmartGoal()
    };

    // Clear saved progress
    localStorage.removeItem('goals-wizard-progress');
    
    onComplete(goalData);
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
      timing: undefined,
      supports: [],
      savedProgress: null
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
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={state.step === 1 ? onBack : handleBack}
              className="p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex-1 mx-4">
              <div className="text-sm font-medium text-center">
                Step {state.step} of {STEPS.length - 1}
              </div>
              <Progress value={(state.step / (STEPS.length - 1)) * 100} className="mt-1" />
            </div>
            
            {/* Exit Button - Available on all steps */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleExit}
              className="p-2"
              title="Exit wizard"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto p-4 pb-8">{/* Reduced bottom padding for category selection */}
        <div className="space-y-6">
          {/* Question */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              {STEPS[state.step - 1]?.title}
            </h1>
            <p className="text-foreground-soft">
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

          {state.step === 3 && state.goal && (
            <OptionSelection
              title="Purpose"
              options={state.goal.purpose}
              onSelect={(purpose) => {
                showRandomAffirmation();
                setState(prev => ({ ...prev, purpose, step: 4 }));
              }}
              selected={state.purpose}
              allowFallback
            />
          )}

          {state.step === 4 && state.goal && (
            <OptionSelection
              title="Details"
              options={state.goal.details}
              onSelect={(details) => {
                showRandomAffirmation();
                setState(prev => ({ ...prev, details, step: 5 }));
              }}
              selected={state.details}
              allowFallback
            />
          )}

          {state.step === 5 && state.goal && (
            <OptionSelection
              title="Timing"
              options={state.goal.timing}
              onSelect={(timing) => {
                showRandomAffirmation();
                setState(prev => ({ ...prev, timing, step: 6 }));
              }}
              selected={state.timing}
            />
          )}

          {state.step === 6 && state.goal && (
            <MultiOptionSelection
              title="Support"
              options={state.goal.supports}
              onSelect={(supports) => {
                setState(prev => ({ ...prev, supports }));
              }}
              selected={state.supports || []}
            />
          )}

          {state.step === 7 && (
            <GoalConfirmation
              smartGoal={buildSmartGoal()}
              onComplete={handleComplete}
              onEdit={() => setState(prev => ({ ...prev, step: 3 }))}
            />
          )}
        </div>
      </div>

      {/* Enhanced Confetti */}
      {showConfetti && <ConfettiAnimation />}

      {/* Footer - only show when step > 2 AND not on category selection */}
      {state.step < 7 && state.step > 2 && (
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
            {state.step === 6 && (
              <Button 
                onClick={() => {
                  showRandomAffirmation();
                  setState(prev => ({ ...prev, step: 7 }));
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
                  step: 5, // Go to timing step, not confirmation
                  category: { id: 'starter', title: 'Starter Goals', emoji: '🌟', goals: [goal] },
                  goal: goal,
                  purpose: goal.purpose.find(p => p.isDefault) || goal.purpose[0],
                  details: goal.details.find(d => d.isDefault) || goal.details[0],
                  timing: undefined, // Let user choose timing
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
}> = ({ title, options, onSelect, selected, allowFallback }) => {
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
  onComplete: () => void;
  onEdit: () => void;
}> = ({ smartGoal, onComplete, onEdit }) => {
  return (
    <div className="text-center space-y-6">
      <div className="text-6xl animate-bounce">🎉</div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">
          Fantastic! Your goal is ready!
        </h2>
        
        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <CardContent className="p-4">
            <div className="text-lg font-semibold text-foreground mb-2">Your SMART Goal:</div>
            <div className="text-foreground">{smartGoal}</div>
          </CardContent>
        </Card>
        
        <p className="text-foreground-soft">
          You're all set to start making positive changes! 
          Remember, small consistent steps lead to big results.
        </p>
      </div>
      
      <div className="space-y-3">
        <Button onClick={onComplete} className="w-full" size="lg">
          Start My Goal!
          <Sparkles className="ml-2 h-4 w-4" />
        </Button>
        
        <Button onClick={onEdit} variant="outline" className="w-full">
          Make Changes
        </Button>
      </div>
    </div>
  );
};
