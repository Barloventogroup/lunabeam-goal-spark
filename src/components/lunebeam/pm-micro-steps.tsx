import React from 'react';
import { QuestionScreen } from './question-screen';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Target, ArrowLeft, ArrowRight } from 'lucide-react';
import { format, addWeeks } from 'date-fns';
import { progressiveMasteryService } from '@/services/progressiveMasteryService';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface PMStepsProps {
  data: any;
  updateData: (updates: any) => void;
  goNext: () => void;
  goBack: () => void;
  currentStep: number;
  totalSteps: number;
  userSupporters: Array<{ id: string; name: string; profile?: { avatar_url?: string } }>;
}

export const PMStep2_Motivation: React.FC<PMStepsProps> = ({ data, updateData, goNext, goBack, currentStep, totalSteps }) => {
  const name = data.recipient === 'other' ? data.supportedPersonName : 'you';
  
  return (
    <QuestionScreen
      currentStep={currentStep}
      totalSteps={totalSteps}
      goalTitle={data.goalTitle}
      questionIcon="💭"
      questionText={`Why does this matter to ${name}?`}
      helpText="Understanding motivation helps maintain commitment when practice gets tough."
      inputType="textarea"
      value={data.motivation || ''}
      onChange={(value) => updateData({ motivation: value })}
      onBack={goBack}
      onContinue={goNext}
      onSkip={goNext}
      hideHeader
      hideFooter
    />
  );
};

export const PMStep3_Prerequisites: React.FC<PMStepsProps> = ({ data, updateData, goNext, goBack, currentStep, totalSteps }) => {
  const name = data.recipient === 'other' ? data.supportedPersonName : 'you';
  
  return (
    <QuestionScreen
      currentStep={currentStep}
      totalSteps={totalSteps}
      goalTitle={data.goalTitle}
      questionIcon="✅"
      questionText={`Does ${name} have what's needed to start?`}
      inputType="yesno"
      options={[
        {
          value: 'yes',
          label: "Yes, ready to start",
          icon: '✅',
          description: "Everything needed is available"
        },
        {
          value: 'no',
          label: "Not quite - need some things first",
          icon: '⚠️',
          description: "There are prerequisites missing"
        }
      ]}
      value={data.prerequisites?.ready ? 'yes' : 'no'}
      onChange={(value) => {
        updateData({ 
          prerequisites: { 
            ready: value === 'yes',
            needs: value === 'yes' ? undefined : data.prerequisites?.needs
          }
        });
      }}
      expandOnValue="no"
      expandedContent={
        <div className="space-y-2 pt-4 animate-in slide-in-from-top-2 duration-300">
          <Label>What does {name} need?</Label>
          <Textarea
            value={data.prerequisites?.needs || ''}
            onChange={(e) => updateData({
              prerequisites: {
                ...data.prerequisites,
                needs: e.target.value
              }
            })}
            placeholder="e.g., Need to buy cooking equipment first"
            rows={3}
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            Focus on the single most important thing needed to begin
          </p>
        </div>
      }
      onBack={goBack}
      onContinue={goNext}
      required
      continueDisabled={!data.prerequisites?.ready && !data.prerequisites?.needs}
      hideHeader
      hideFooter
    />
  );
};

export const PMStep4_Barriers: React.FC<PMStepsProps & { onSwitchToHabit?: () => void }> = ({ data, updateData, goNext, goBack, currentStep, totalSteps, onSwitchToHabit }) => {
  const name = data.recipient === 'other' ? data.supportedPersonName : 'you';
  const level = data.pmAssessment?.calculatedLevel || 3;
  const levelLabel = data.pmAssessment?.levelLabel || 'Developing';
  const levelEmojis = ['🌱', '🌿', '🌳', '🎯', '⭐'];
  
  const levelContext = `Starting Level: ${levelLabel} ${levelEmojis[level - 1]}`;
  
  const challengeOptions = [
    { 
      id: 'initiation', 
      label: "Just Starting", 
      description: "(Initiation)"
    },
    { 
      id: 'attention', 
      label: "Staying Focused", 
      description: "(Attention)"
    },
    { 
      id: 'time', 
      label: "Remembering", 
      description: "(Time)"
    },
    { 
      id: 'planning', 
      label: "Knowing What's Next", 
      description: "(Planning)"
    }
  ];

  const barriers = typeof data.barriers === 'object' && data.barriers !== null
    ? data.barriers 
    : { priority1: '', priority2: '', details: '' };
  
  const handlePriorityToggle = (challengeId: string) => {
    const current = barriers as any;
    
    if (current.priority1 === challengeId) {
      // Clicking 1st priority again - remove it, promote 2nd to 1st
      updateData({ 
        barriers: { 
          ...current,
          priority1: current.priority2 || '',
          priority2: ''
        } 
      });
    } else if (current.priority2 === challengeId) {
      // Clicking 2nd priority again - remove it
      updateData({ 
        barriers: { 
          ...current,
          priority2: ''
        } 
      });
    } else if (!current.priority1) {
      // No 1st priority - set as 1st
      updateData({ 
        barriers: { 
          ...current,
          priority1: challengeId
        } 
      });
    } else if (!current.priority2) {
      // Has 1st but no 2nd - set as 2nd
      updateData({ 
        barriers: { 
          ...current,
          priority2: challengeId
        } 
      });
    } else {
      // Both slots filled - replace 2nd priority
      updateData({ 
        barriers: { 
          ...current,
          priority2: challengeId
        } 
      });
    }
  };

  const getPriorityBadge = (challengeId: string) => {
    const current = barriers as any;
    if (current.priority1 === challengeId) return '1st Priority';
    if (current.priority2 === challengeId) return '2nd Priority';
    return null;
  };

  return (
    <QuestionScreen
      currentStep={currentStep}
      totalSteps={totalSteps}
      goalTitle={data.goalTitle}
      goalContext={levelContext}
      questionIcon="🤔"
      questionText={`Which part usually feels the trickiest when ${name === 'you' ? 'you' : name} start${name === 'you' ? '' : 's'} this?`}
      inputType="custom"
      onBack={goBack}
      onContinue={goNext}
      onSkip={goNext}
      hideHeader
      hideFooter
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground text-center mb-6">
          start building the plan to crush this goal
        </p>

        {level === 5 && (
          <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 mb-6">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="font-semibold text-blue-900 dark:text-blue-100">💡 Suggestion</p>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    You're already independent with this! Consider using a Habit goal instead to track consistency.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      onSwitchToHabit?.();
                    }}
                    className="mt-2"
                  >
                    Switch to Habit Goal
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Challenge Options */}
        <div className="space-y-3 mb-6">
          {challengeOptions.map((option) => {
            const priority = getPriorityBadge(option.id);
            const isSelected = priority !== null;
            
            return (
              <button
                key={option.id}
                onClick={() => handlePriorityToggle(option.id)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  isSelected 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border bg-card hover:border-primary/50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    {isSelected && (
                      <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    <div className="flex-1">
                      <div className="font-semibold text-foreground mb-0.5">
                        {option.label}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {option.description}
                      </div>
                    </div>
                  </div>
                  {priority && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary text-primary-foreground flex-shrink-0">
                      {priority}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Tell us more */}
        <div className="space-y-2 pt-2">
          <Label>Tell us more</Label>
          <Textarea
            value={(barriers as any).details || ''}
            onChange={(e) => updateData({ 
              barriers: { 
                ...(barriers as any),
                details: e.target.value 
              } 
            })}
            placeholder="Share any additional details here..."
            rows={3}
          />
        </div>
      </div>
    </QuestionScreen>
  );
};

export const PMStep5_Experience: React.FC<PMStepsProps> = ({ data, updateData, goNext, goBack, currentStep, totalSteps }) => {
  return (
    <QuestionScreen
      currentStep={currentStep}
      totalSteps={totalSteps}
      goalTitle={data.goalTitle}
      questionIcon="📊"
      questionText={`How much experience with ${data.goalTitle?.toLowerCase()}?`}
      inputType="radio"
      options={[
        { value: 1, label: "Brand new to this", icon: '🌱', description: 'Never tried before' },
        { value: 2, label: "Tried once or twice", icon: '🌿', description: 'Just getting started' },
        { value: 3, label: "Some experience", icon: '🌳', description: 'Done it a few times' },
        { value: 4, label: "Pretty experienced", icon: '🎯', description: 'Do this regularly' },
        { value: 5, label: "Very experienced", icon: '⭐', description: 'Can do well independently' }
      ]}
      value={data.pmAssessment?.q1_experience}
      onChange={(value) => updateData({
        pmAssessment: {
          ...data.pmAssessment,
          q1_experience: parseInt(value)
        }
      })}
      onBack={goBack}
      onContinue={goNext}
      required
      hideHeader
      hideFooter
    />
  );
};

export const PMStep6_Confidence: React.FC<PMStepsProps> = ({ data, updateData, goNext, goBack, currentStep, totalSteps }) => {
  return (
    <QuestionScreen
      currentStep={currentStep}
      totalSteps={totalSteps}
      goalTitle={data.goalTitle}
      questionIcon="😊"
      questionText="How confident do you feel about this?"
      inputType="radio"
      options={[
        { value: 1, label: "Not confident at all", icon: '😰', description: 'This feels really scary' },
        { value: 2, label: "A little nervous", icon: '😟', description: 'Unsure but willing to try' },
        { value: 3, label: "Somewhat confident", icon: '😐', description: 'Can do with support' },
        { value: 4, label: "Pretty confident", icon: '😊', description: 'Feel good about this' },
        { value: 5, label: "Very confident", icon: '😄', description: "Ready to do this!" }
      ]}
      value={data.pmAssessment?.q2_confidence}
      onChange={(value) => updateData({
        pmAssessment: {
          ...data.pmAssessment,
          q2_confidence: parseInt(value)
        }
      })}
      onBack={goBack}
      onContinue={goNext}
      required
      hideHeader
      hideFooter
    />
  );
};

export const PMStep7_HelpNeeded: React.FC<PMStepsProps> = ({ data, updateData, goNext, goBack, currentStep, totalSteps }) => {
  const { toast } = useToast();
  
  const handleContinue = () => {
    // Calculate level after Q3 is answered
    if (data.pmAssessment?.q1_experience && 
        data.pmAssessment?.q2_confidence && 
        data.pmAssessment?.q3_help_needed) {
      
      const level = progressiveMasteryService.calculateSkillLevel({
        q1: data.pmAssessment.q1_experience,
        q2: data.pmAssessment.q2_confidence,
        q3: data.pmAssessment.q3_help_needed
      });
      
      const levelLabel = progressiveMasteryService.getSkillLevelLabel(level);
      const levelEmojis = ['🌱', '🌿', '🌳', '🎯', '⭐'];
      
      updateData({
        pmAssessment: {
          ...data.pmAssessment,
          calculatedLevel: level,
          levelLabel: levelLabel
        }
      });
      
      // Show celebration toast
      toast({
        title: `Your Starting Level: ${levelLabel} ${levelEmojis[level - 1]}`,
        description: "Great! Now let's plan your learning journey.",
        duration: 3000
      });
    }
    
    goNext();
  };
  
  return (
    <QuestionScreen
      currentStep={currentStep}
      totalSteps={totalSteps}
      goalTitle={data.goalTitle}
      questionIcon="👥"
      questionText="How much help do you need right now?"
      inputType="radio"
      options={[
        { value: 1, label: "Full help - do it for me", icon: '👥👥', description: 'Someone else does it' },
        { value: 2, label: "A lot - step-by-step guidance", icon: '👥', description: 'Guide through each step' },
        { value: 3, label: "Some help - available if stuck", icon: '🤝', description: 'Be nearby for questions' },
        { value: 4, label: "A little - just check my work", icon: '👋', description: 'Review when done' },
        { value: 5, label: "No help - can do alone", icon: '⭐', description: 'Fully independent' }
      ]}
      value={data.pmAssessment?.q3_help_needed}
      onChange={(value) => updateData({
        pmAssessment: {
          ...data.pmAssessment,
          q3_help_needed: parseInt(value)
        }
      })}
      onBack={goBack}
      onContinue={handleContinue}
      required
      hideHeader
      hideFooter
    />
  );
};

export const PMStep8_Helper: React.FC<PMStepsProps> = ({ data, updateData, goNext, goBack, currentStep, totalSteps, userSupporters }) => {
  const levelContext = data.pmAssessment?.calculatedLevel 
    ? `Starting Level: ${data.pmAssessment.levelLabel} ${['🌱', '🌿', '🌳', '🎯', '⭐'][data.pmAssessment.calculatedLevel - 1]}`
    : undefined;
  
  const options = [
    { 
      value: 'none', 
      label: "I'll learn on my own", 
      description: 'Prefer to figure it out myself' 
    },
    ...userSupporters.map(s => ({
      value: s.id,
      label: s.name,
      description: s.name
    }))
  ];
  
  return (
    <QuestionScreen
      currentStep={currentStep}
      totalSteps={totalSteps}
      goalTitle={data.goalTitle}
      goalContext={levelContext}
      questionIcon="👥"
      questionText="Who can help you learn this?"
      inputType="radio"
      options={options}
      value={data.pmHelper?.helperId}
      onChange={(value) => {
        const helper = userSupporters.find(s => s.id === value);
        updateData({
          pmHelper: {
            helperId: value,
            helperName: helper?.name
          }
        });
      }}
      onBack={goBack}
      onContinue={goNext}
      onSkip={goNext}
      hideHeader
      hideFooter
    />
  );
};

export const PMStep9_PracticePlan: React.FC<PMStepsProps> = ({ data, updateData, goNext, goBack, currentStep, totalSteps }) => {
  const [showCustomSelector, setShowCustomSelector] = React.useState(false);
  
  const levelContext = data.pmAssessment?.calculatedLevel 
    ? `Starting Level: ${data.pmAssessment.levelLabel} ${['🌱', '🌿', '🌳', '🎯', '⭐'][data.pmAssessment.calculatedLevel - 1]}`
    : undefined;
  
  const level = data.pmAssessment?.calculatedLevel || 3;
  
  // Use a sensible default target frequency based on skill level
  // Beginners: 3×, Intermediate: 4×, Advanced: 5×
  const defaultTargetFreq = level <= 2 ? 3 : (level >= 4 ? 5 : 4);
  const targetFreq = data.pmPracticePlan?.targetFrequency || defaultTargetFreq;
  
  const smartStartPlan = progressiveMasteryService.suggestStartFrequency(level, targetFreq);
  const smartStartFreq = smartStartPlan.suggested_initial;
  
  // Auto-set target frequency if not already set
  React.useEffect(() => {
    if (!data.pmPracticePlan?.targetFrequency) {
      updateData({
        pmPracticePlan: {
          ...data.pmPracticePlan,
          targetFrequency: defaultTargetFreq
        }
      });
    }
  }, []);
  
  const isComplete = data.pmPracticePlan?.startingFrequency && 
                     data.pmPracticePlan?.durationWeeks !== undefined;
  
  return (
    <QuestionScreen
      currentStep={currentStep}
      totalSteps={totalSteps}
      goalTitle={data.goalTitle}
      goalContext={levelContext}
      questionIcon="🎯"
      questionText="Your Practice Plan"
      helpText="Let's set up your learning schedule"
      inputType="custom"
      onBack={goBack}
      onContinue={goNext}
      continueDisabled={!isComplete}
      hideHeader
      hideFooter
    >
      <div className="space-y-6">
        {/* Smart Start Suggestion */}
        {(
          <Card className="bg-primary/5 border-primary/20 animate-in fade-in duration-300">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-3">
                  <div className="font-semibold">💡 Smart Start: Begin with {smartStartFreq}× per week</div>
                  <p className="text-sm text-muted-foreground">
                    {smartStartPlan.rationale}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        updateData({
                          pmPracticePlan: {
                            ...data.pmPracticePlan,
                            startingFrequency: smartStartFreq,
                            targetFrequency: smartStartFreq,
                            smartStartAccepted: true
                          }
                        });
                      }}
                      variant={data.pmPracticePlan?.smartStartAccepted ? 'default' : 'secondary'}
                    >
                      ✓ Sounds good
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowCustomSelector(!showCustomSelector);
                        if (!showCustomSelector) {
                          updateData({
                            pmPracticePlan: {
                              ...data.pmPracticePlan,
                              smartStartAccepted: false
                            }
                          });
                        }
                      }}
                    >
                      {showCustomSelector ? 'Hide options ▲' : 'Let me choose ▼'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Custom Frequency Selector */}
        {showCustomSelector && (
          <Card className="bg-accent/50 border-primary/30 animate-in fade-in slide-in-from-top-2 duration-300">
            <CardContent className="p-4 space-y-3">
              <Label className="text-sm font-semibold">Choose your starting frequency:</Label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4, 5, 6, 7].map(freq => (
                  <Button
                    key={freq}
                    variant={data.pmPracticePlan?.startingFrequency === freq && !data.pmPracticePlan?.smartStartAccepted ? 'default' : 'outline'}
                    onClick={() => {
                      updateData({
                        pmPracticePlan: {
                          ...data.pmPracticePlan,
                          startingFrequency: freq,
                          targetFrequency: freq,
                          smartStartAccepted: false
                        }
                      });
                    }}
                    className="h-12"
                  >
                    {freq}×
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                per week
              </p>
            </CardContent>
          </Card>
        )}
        
        {/* Q2: Duration */}
        <div className="space-y-3">
          <Label className="text-base">How long do you want to work on this?</Label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { weeks: 8, label: '8 weeks' },
              { weeks: 12, label: '12 weeks' },
              { weeks: 16, label: '16 weeks' },
              { weeks: null, label: 'Ongoing' }
            ].map(option => (
              <Button
                key={option.weeks || 'ongoing'}
                variant={data.pmPracticePlan?.durationWeeks === option.weeks ? 'default' : 'outline'}
                onClick={() => updateData({
                  pmPracticePlan: {
                    ...data.pmPracticePlan,
                    durationWeeks: option.weeks
                  }
                })}
                className="h-16 flex flex-col items-center justify-center"
              >
                <span className="font-semibold">{option.label}</span>
              </Button>
            ))}
          </div>
        </div>
        
        {/* Preview Summary */}
        {data.pmPracticePlan?.startingFrequency && data.pmPracticePlan?.durationWeeks !== undefined && (
          <Card className="bg-accent animate-in fade-in duration-300">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-semibold">📊 Your Plan</div>
                  <p className="text-sm text-muted-foreground">
                    {data.pmPracticePlan.smartStartAccepted && (
                      <span className="inline-flex items-center gap-1 text-primary">
                        <Sparkles className="h-3 w-3" /> Smart Start: 
                      </span>
                    )}
                    Practice {data.pmPracticePlan.startingFrequency}× per week 
                    {data.pmPracticePlan.durationWeeks 
                      ? ` for ${data.pmPracticePlan.durationWeeks} weeks`
                      : ' (ongoing)'}
                  </p>
                  {data.pmPracticePlan.durationWeeks && (
                    <p className="text-xs text-muted-foreground mt-1">
                      End date: {format(addWeeks(new Date(), data.pmPracticePlan.durationWeeks), 'MMMM d, yyyy')}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </QuestionScreen>
  );
};
