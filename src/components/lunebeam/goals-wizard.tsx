import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, X, Info, Sparkles, Mic, Volume2, Users } from 'lucide-react';
import { GOALS_WIZARD_DATA, FALLBACK_OPTION, Category, CategoryGoal, GoalOption } from '@/data/goals-wizard-data';
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
  { id: 6, title: "Support", subtitle: "What will help you succeed?" },
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
  const [showExplainer, setShowExplainer] = useState<string | null>(null);
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

  // Load saved progress on mount
  useEffect(() => {
    const saved = localStorage.getItem('goals-wizard-progress');
    if (saved) {
      try {
        const savedState = JSON.parse(saved);
        if (savedState.step > 1) {
          setState({ ...savedState, savedProgress: savedState });
        }
      } catch (e) {
        console.error('Error loading saved progress:', e);
      }
    }
  }, []);

  // Auto-save progress
  useEffect(() => {
    if (state.step > 1) {
      localStorage.setItem('goals-wizard-progress', JSON.stringify(state));
    }
  }, [state]);

  // Text-to-speech for questions and explainers
  useEffect(() => {
    if (isTextToSpeechEnabled && state.step > 0 && STEPS[state.step - 1]) {
      const questionText = `${STEPS[state.step - 1].title}. ${STEPS[state.step - 1].subtitle}`;
      setTimeout(() => textToSpeech.speak(questionText), 500);
    }
  }, [state.step, isTextToSpeechEnabled, textToSpeech]);

  // Handle voice input results
  useEffect(() => {
    if (voiceInput.transcript && isVoiceInputEnabled) {
      // Simple keyword matching for voice navigation
      const transcript = voiceInput.transcript.toLowerCase();
      if (transcript.includes('next') || transcript.includes('continue')) {
        if (canProceed()) {
          handleNext();
        }
      } else if (transcript.includes('back') || transcript.includes('previous')) {
        handleBack();
      }
    }
  }, [voiceInput.transcript, isVoiceInputEnabled]);

  const showRandomAffirmation = () => {
    const randomAffirmation = AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)];
    setAffirmation(randomAffirmation);
    setTimeout(() => setAffirmation(""), 3000);
  };

  const handleNext = () => {
    showRandomAffirmation();
    setState(prev => ({ ...prev, step: prev.step + 1 }));
  };

  const handleBack = () => {
    setState(prev => ({ ...prev, step: Math.max(1, prev.step - 1) }));
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

  const canProceed = () => {
    switch (state.step) {
      case 1: return !!state.category;
      case 2: return !!state.goal;
      case 3: return !!state.purpose;
      case 4: return !!state.details;
      case 5: return !!state.timing;
      case 6: return !!state.supports?.length;
      default: return false;
    }
  };

  const buildSmartGoal = () => {
    if (!state.goal || !state.purpose || !state.details || !state.timing) return "";

    // Compose a friendly SMART sentence from selected labels
    const emoji = state.goal.emoji ? `${state.goal.emoji} ` : "";
    const title = state.goal.title;
    const detailsPart = state.details.label; // already includes duration/place wording
    const timingPart = state.timing.label;   // already contains frequency + weeks phrasing
    const purposeSuffix = state.purpose?.label
      ? ` to ${state.purpose.label.toLowerCase()}`
      : "";

    let sentence = `${emoji}${title} ${detailsPart}, ${timingPart}${purposeSuffix}.`;

    if (state.supports?.length) {
      sentence += ` (with ${state.supports.map(s => s.label).join(', ')})`;
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
    setState({ step: 1 });
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
            
            {/* Next Button in Header */}
            {state.step < 7 ? (
              <Button 
                onClick={handleNext}
                disabled={!canProceed()}
                size="sm"
                className="px-4"
              >
                {state.step === 6 ? "Review" : "Next"}
                <Sparkles className="ml-1 h-3 w-3" />
              </Button>
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleExit}
                className="p-2"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto p-4 pb-32">
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
              onSelect={(category) => setState(prev => ({ ...prev, category }))}
              selected={state.category}
              onShowExplainer={setShowExplainer}
              showExplainer={showExplainer}
              onSelectDefault={(defaultState) => setState(defaultState)}
            />
          )}

          {state.step === 2 && state.category && (
            <GoalSelection 
              category={state.category}
              onSelect={(goal) => setState(prev => ({ ...prev, goal }))}
              selected={state.goal}
              onShowExplainer={setShowExplainer}
              showExplainer={showExplainer}
            />
          )}

          {state.step === 3 && state.goal && (
            <OptionSelection
              title="Purpose"
              options={state.goal.purpose}
              onSelect={(purpose) => setState(prev => ({ ...prev, purpose }))}
              selected={state.purpose}
              onShowExplainer={setShowExplainer}
              showExplainer={showExplainer}
              allowFallback
            />
          )}

          {state.step === 4 && state.goal && (
            <OptionSelection
              title="Details"
              options={state.goal.details}
              onSelect={(details) => setState(prev => ({ ...prev, details }))}
              selected={state.details}
              onShowExplainer={setShowExplainer}
              showExplainer={showExplainer}
              allowFallback
            />
          )}

          {state.step === 5 && state.goal && (
            <OptionSelection
              title="Timing"
              options={state.goal.timing}
              onSelect={(timing) => setState(prev => ({ ...prev, timing }))}
              selected={state.timing}
              onShowExplainer={setShowExplainer}
              showExplainer={showExplainer}
              allowFallback
            />
          )}

          {state.step === 6 && state.goal && (
            <MultiOptionSelection
              title="Support"
              options={state.goal.supports}
              onSelect={(supports) => setState(prev => ({ ...prev, supports }))}
              selected={state.supports || []}
              onShowExplainer={setShowExplainer}
              showExplainer={showExplainer}
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

      {/* Footer */}
      {state.step < 7 && (
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t">
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
          </div>
        </div>
      )}
    </div>
  );
};

// Category Selection Component
const CategorySelection: React.FC<{
  onSelect: (category: Category) => void;
  selected?: Category;
  onShowExplainer: (id: string | null) => void;
  showExplainer: string | null;
  onSelectDefault?: (defaults: WizardState) => void;
}> = ({ onSelect, selected, onShowExplainer, showExplainer, onSelectDefault }) => {
  return (
    <div className="space-y-3">
      {GOALS_WIZARD_DATA.map((category) => (
        <div key={category.id}>
          <Card 
            className={`cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
              selected?.id === category.id 
                ? 'border-primary bg-primary/5' 
                : 'hover:border-primary/30'
            }`}
            onClick={() => { onSelect(category); onShowExplainer(category.id); }}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{category.emoji}</div>
                  <div className="font-semibold text-foreground">{category.title}</div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onShowExplainer(showExplainer === category.id ? null : category.id);
                  }}
                  className="p-1"
                >
                  <Info className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {showExplainer === category.id && (
            <Card className="mt-2 bg-muted/50 animate-fade-in">
              <CardContent className="p-3">
                <div className="text-sm text-foreground-soft">
                  Goals in this category help with {category.title.toLowerCase()} skills and habits.
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ))}
      
      {/* Fallback Option */}
      <Card 
        className={`cursor-pointer transition-all duration-200 hover:scale-[1.02] border-dashed ${
          selected?.id === 'unsure' 
            ? 'border-primary bg-primary/5' 
            : 'hover:border-primary/30'
        }`}
        onClick={() => {
          // Auto-select health category and proceed with defaults
          const healthCategory = GOALS_WIZARD_DATA[0]; // Health category
          onSelect(healthCategory);
          
          // Set up defaults for the complete flow using the callback
          if (onSelectDefault) {
            setTimeout(() => {
              const walkGoal = healthCategory.goals[0]; // Walk goal
              onSelectDefault({ 
                step: 7, // Jump to confirmation
                category: healthCategory,
                goal: walkGoal,
                purpose: walkGoal.purpose.find(p => p.isDefault) || walkGoal.purpose[0],
                details: walkGoal.details.find(d => d.isDefault) || walkGoal.details[0],
                timing: walkGoal.timing.find(t => t.isDefault) || walkGoal.timing[0],
                supports: walkGoal.supports.filter(s => s.isDefault).slice(0, 1)
              });
            }, 100);
          }
        }}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">{FALLBACK_OPTION.emoji}</div>
              <div className="font-semibold text-foreground">{FALLBACK_OPTION.label}</div>
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
  selected?: CategoryGoal;
  onShowExplainer: (id: string | null) => void;
  showExplainer: string | null;
}> = ({ category, onSelect, selected, onShowExplainer, showExplainer }) => {
  return (
    <div className="space-y-3">
      {category.goals.map((goal) => (
        <div key={goal.id}>
          <Card 
            className={`cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
              selected?.id === goal.id 
                ? 'border-primary bg-primary/5' 
                : 'hover:border-primary/30'
            }`}
            onClick={() => { onSelect(goal); onShowExplainer(goal.id); }}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{goal.emoji}</div>
                  <div className="font-semibold text-foreground">{goal.title}</div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onShowExplainer(showExplainer === goal.id ? null : goal.id);
                  }}
                  className="p-1"
                >
                  <Info className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {showExplainer === goal.id && (
            <Card className="mt-2 bg-muted/50 animate-fade-in">
              <CardContent className="p-3">
                <div className="text-sm text-foreground-soft">
                  {goal.explainer}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ))}
      
      {/* Fallback Option */}
      <Card 
        className="cursor-pointer transition-all duration-200 hover:scale-[1.02] border-dashed hover:border-primary/30"
        onClick={() => {
          // Auto-select first goal as fallback
          onSelect(category.goals[0]);
        }}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{FALLBACK_OPTION.emoji}</div>
            <div className="font-semibold text-foreground">{FALLBACK_OPTION.label}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Option Selection Component (for single choice)
const OptionSelection: React.FC<{
  title: string;
  options: GoalOption[];
  onSelect: (option: GoalOption) => void;
  selected?: GoalOption;
  onShowExplainer: (id: string | null) => void;
  showExplainer: string | null;
  allowFallback?: boolean;
}> = ({ options, onSelect, selected, onShowExplainer, showExplainer, allowFallback }) => {
  return (
    <div className="space-y-3">
      {options.map((option) => (
        <div key={option.id}>
          <Card 
            className={`cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
              selected?.id === option.id 
                ? 'border-primary bg-primary/5' 
                : 'hover:border-primary/30'
            }`}
            onClick={() => { onSelect(option); onShowExplainer(option.id); }}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-xl">{option.emoji}</div>
                  <div className="font-semibold text-foreground">{option.label}</div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onShowExplainer(showExplainer === option.id ? null : option.id);
                  }}
                  className="p-1"
                >
                  <Info className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {showExplainer === option.id && (
            <Card className="mt-2 bg-muted/50 animate-fade-in">
              <CardContent className="p-3">
                <div className="text-sm text-foreground-soft">
                  {option.explainer}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ))}
      
      {/* Fallback Option */}
      {allowFallback && (
        <Card 
          className="cursor-pointer transition-all duration-200 hover:scale-[1.02] border-dashed hover:border-primary/30"
          onClick={() => {
            // Auto-select default or first option and show explainer
            const defaultOption = options.find(o => o.isDefault) || options[0];
            onSelect(defaultOption);
            onShowExplainer(defaultOption.id);
          }}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="text-xl">{FALLBACK_OPTION.emoji}</div>
              <div>
                <div className="font-semibold text-foreground">{FALLBACK_OPTION.label}</div>
                <div className="text-xs text-foreground-soft mt-1">We’ll start small: {(options.find(o => o.isDefault) || options[0]).label}.</div>
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
  onShowExplainer: (id: string | null) => void;
  showExplainer: string | null;
}> = ({ options, onSelect, selected, onShowExplainer, showExplainer }) => {
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
        <div key={option.id}>
          <Card 
            className={`cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
              selected.some(s => s.id === option.id)
                ? 'border-primary bg-primary/5' 
                : 'hover:border-primary/30'
            }`}
            onClick={() => handleToggle(option)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-xl">{option.emoji}</div>
                  <div className="font-semibold text-foreground">{option.label}</div>
                  {option.isDefault && (
                    <div className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                      Recommended
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onShowExplainer(showExplainer === option.id ? null : option.id);
                  }}
                  className="p-1"
                >
                  <Info className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {showExplainer === option.id && (
            <Card className="mt-2 bg-muted/50 animate-fade-in">
              <CardContent className="p-3">
                <div className="text-sm text-foreground-soft">
                  {option.explainer}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ))}
      
      {/* Auto-select defaults if none selected */}
      {selected.length === 0 && (
        <Card 
          className="cursor-pointer transition-all duration-200 hover:scale-[1.02] border-dashed hover:border-primary/30"
          onClick={() => {
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