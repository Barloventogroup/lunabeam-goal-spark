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

export const PMStep4_Barriers: React.FC<PMStepsProps> = ({ data, updateData, goNext, goBack, currentStep, totalSteps }) => {
  const name = data.recipient === 'other' ? data.supportedPersonName : 'you';
  const level = data.pmAssessment?.calculatedLevel || 3;
  const levelLabel = data.pmAssessment?.levelLabel || 'Developing';
  const levelEmojis = ['🌱', '🌿', '🌳', '🎯', '⭐'];
  
  const levelContext = `Starting Level: ${levelLabel} ${levelEmojis[level - 1]}`;
  
  const introTextByLevel: Record<number, string> = {
    1: "As a beginner, many things will be new. Common challenges include:",
    2: "As an early learner, you're building foundations. You might face:",
    3: "At the developing level, you have some experience but might face challenges with:",
    4: "As someone proficient, you're refining skills. Common challenges include:",
    5: "At your independent level, you might not need much support."
  };
  
  const barrierExamplesByLevel: Record<number, string[]> = {
    1: [
      'Understanding basic techniques and terminology',
      'Feeling overwhelmed by new information',
      'Knowing where to start',
      'Safety concerns with new equipment'
    ],
    2: [
      'Remembering steps without constant guidance',
      'Building confidence to try independently',
      'Understanding why certain steps matter',
      'Managing safety with less supervision'
    ],
    3: [
      'Following complex multi-step processes',
      'Timing multiple things at once',
      'Remembering sequences without prompts',
      'Managing safety independently'
    ],
    4: [
      'Refining technique for consistency',
      'Adapting when things don\'t go as planned',
      'Managing time efficiently',
      'Troubleshooting problems independently'
    ],
    5: [
      'You may not face many barriers at this level',
      'Consider maintaining consistency instead'
    ]
  };
  
  return (
    <QuestionScreen
      currentStep={currentStep}
      totalSteps={totalSteps}
      goalTitle={data.goalTitle}
      goalContext={levelContext}
      questionIcon="🤔"
      questionText={`What might be challenging for ${name}?`}
      inputType="custom"
      onBack={goBack}
      onContinue={goNext}
      onSkip={goNext}
      hideHeader
      hideFooter
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {introTextByLevel[level]}
        </p>
        
        <ul className="space-y-2">
          {barrierExamplesByLevel[level].map((example, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm">
              <span className="text-muted-foreground mt-0.5">•</span>
              <span>{example}</span>
            </li>
          ))}
        </ul>
        
        {level === 5 && (
          <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
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
                      updateData({ goalType: 'reminder' });
                      goNext();
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
        
        <div className="space-y-2 pt-2">
          <Label>Your specific barriers (optional)</Label>
          <Textarea
            value={data.barriers || ''}
            onChange={(e) => updateData({ barriers: e.target.value })}
            placeholder="For example: keeping track of multiple steps..."
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            This helps your helper know where to focus support.
          </p>
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
      description: 'Supporter'
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
  const levelContext = data.pmAssessment?.calculatedLevel 
    ? `Starting Level: ${data.pmAssessment.levelLabel} ${['🌱', '🌿', '🌳', '🎯', '⭐'][data.pmAssessment.calculatedLevel - 1]}`
    : undefined;
  
  const targetFreq = data.pmPracticePlan?.targetFrequency || 3;
  const level = data.pmAssessment?.calculatedLevel || 3;
  
  const smartStartPlan = progressiveMasteryService.suggestStartFrequency(level, targetFreq);
  const smartStartFreq = smartStartPlan.suggested_initial;
  
  const isComplete = data.pmPracticePlan?.targetFrequency && 
                     data.pmPracticePlan?.startingFrequency && 
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
        {/* Q1: Target Frequency */}
        <div className="space-y-3">
          <Label className="text-base">How often do you want to practice eventually?</Label>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map(freq => (
              <Button
                key={freq}
                variant={data.pmPracticePlan?.targetFrequency === freq ? 'default' : 'outline'}
                onClick={() => updateData({
                  pmPracticePlan: {
                    ...data.pmPracticePlan,
                    targetFrequency: freq
                  }
                })}
                className="h-12"
              >
                {freq}×
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">per week</p>
        </div>
        
        {/* Smart Start Suggestion */}
        {data.pmPracticePlan?.targetFrequency && (
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
                        updateData({
                          pmPracticePlan: {
                            ...data.pmPracticePlan,
                            startingFrequency: data.pmPracticePlan?.targetFrequency,
                            smartStartAccepted: false
                          }
                        });
                      }}
                    >
                      Let me choose ▼
                    </Button>
                  </div>
                </div>
              </div>
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
