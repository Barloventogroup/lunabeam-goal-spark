import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Brain, Sparkles, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { BackButton } from '@/components/ui/back-button';
import { cn } from '@/lib/utils';
import { progressiveMasteryService } from '@/services/progressiveMasteryService';

interface AssessmentResponses {
  q1_familiarity: number;
  q2_confidence: number;
  q3_independence: number;
}

interface SkillAssessmentWizardProps {
  goalTitle: string;
  onComplete: (assessment: SkillAssessment) => void;
  onBack: () => void;
}

interface SkillAssessment {
  calculated_level: number;
  level_label: string;
  q1_familiarity: number;
  q2_confidence: number;
  q3_independence: number;
  assessment_date: string;
}

interface QuestionOption {
  label: string;
  description: string;
  emoji: string;
}

interface Question {
  key: keyof AssessmentResponses;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  options: QuestionOption[];
}

const questions: Question[] = [
  {
    key: 'q1_familiarity',
    title: 'How familiar are you with {goal}?',
    subtitle: 'Tell us about your experience level',
    icon: Brain,
    options: [
      {
        label: 'Brand new',
        description: 'Never done this before',
        emoji: '🌱'
      },
      {
        label: 'Heard about it',
        description: 'Seen it but never tried',
        emoji: '👀'
      },
      {
        label: 'Some experience',
        description: 'Tried a few times',
        emoji: '🚶'
      },
      {
        label: 'Pretty comfortable',
        description: 'Done it regularly',
        emoji: '💪'
      },
      {
        label: 'Very experienced',
        description: 'Could teach someone',
        emoji: '⭐'
      }
    ]
  },
  {
    key: 'q2_confidence',
    title: 'How confident do you feel about {goal}?',
    subtitle: 'Rate your current confidence level',
    icon: Sparkles,
    options: [
      {
        label: 'Very unsure',
        description: 'Would need lots of help',
        emoji: '😰'
      },
      {
        label: 'A bit nervous',
        description: 'Need guidance to start',
        emoji: '😟'
      },
      {
        label: 'Somewhat confident',
        description: 'Can try with support',
        emoji: '😐'
      },
      {
        label: 'Confident',
        description: 'Can do most on my own',
        emoji: '😊'
      },
      {
        label: 'Very confident',
        description: 'Ready to go!',
        emoji: '😄'
      }
    ]
  },
  {
    key: 'q3_independence',
    title: 'If you did {goal} today, how much help would you need?',
    subtitle: 'Think about your current independence level',
    icon: Rocket,
    options: [
      {
        label: 'Full support',
        description: 'Someone needs to guide me through it',
        emoji: '🤝'
      },
      {
        label: 'Lots of help',
        description: 'Need reminders and step-by-step',
        emoji: '👋'
      },
      {
        label: 'Some help',
        description: 'Just need occasional check-ins',
        emoji: '🚶'
      },
      {
        label: 'Minimal help',
        description: 'Can do it mostly alone',
        emoji: '🏃'
      },
      {
        label: 'Independent',
        description: 'Can do it completely on my own',
        emoji: '⭐'
      }
    ]
  }
];

export const SkillAssessmentWizard: React.FC<SkillAssessmentWizardProps> = ({
  goalTitle,
  onComplete,
  onBack
}) => {
  const [showIntro, setShowIntro] = useState(true);
  const [responses, setResponses] = useState<AssessmentResponses>({
    q1_familiarity: 0,
    q2_confidence: 0,
    q3_independence: 0
  });
  const [liveLevel, setLiveLevel] = useState(0);
  const [liveLevelLabel, setLiveLevelLabel] = useState('');

  const allQuestionsAnswered = 
    responses.q1_familiarity > 0 && 
    responses.q2_confidence > 0 && 
    responses.q3_independence > 0;

  // Live calculation whenever responses change
  useEffect(() => {
    if (responses.q1_familiarity > 0 || responses.q2_confidence > 0 || responses.q3_independence > 0) {
      const level = progressiveMasteryService.calculateSkillLevel({
        q1: responses.q1_familiarity || 0,
        q2: responses.q2_confidence || 0,
        q3: responses.q3_independence || 0
      });
      const label = progressiveMasteryService.getSkillLevelLabel(level);
      setLiveLevel(level);
      setLiveLevelLabel(label);
    }
  }, [responses]);

  const handleResponseChange = (questionKey: keyof AssessmentResponses, value: string) => {
    setResponses(prev => ({
      ...prev,
      [questionKey]: parseInt(value)
    }));
  };

  const handleComplete = () => {
    const assessment: SkillAssessment = {
      calculated_level: liveLevel,
      level_label: liveLevelLabel.toLowerCase().replace(/\s+/g, '_'),
      q1_familiarity: responses.q1_familiarity,
      q2_confidence: responses.q2_confidence,
      q3_independence: responses.q3_independence,
      assessment_date: new Date().toISOString()
    };

    onComplete(assessment);
  };

  const getLevelEmoji = (level: number): string => {
    const emojis = ['🌱', '📚', '🚀', '⭐', '🏆'];
    return emojis[level - 1] || '🌱';
  };

  const renderIntroScreen = () => {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="pt-8 pb-6 px-6">
            <div className="text-center space-y-6">
              {/* Icon */}
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                  <Brain className="h-10 w-10 text-primary" />
                </div>
              </div>

              {/* Main message */}
              <div className="space-y-3">
                <h1 className="text-2xl md:text-3xl font-bold">
                  Let's check how good you are at performing this goal independently
                </h1>
                <p className="text-muted-foreground text-lg">
                  This quick assessment helps us create the perfect learning path for you
                </p>
              </div>

              {/* What to expect */}
              <div className="bg-muted/50 rounded-lg p-4 text-left">
                <p className="text-sm text-muted-foreground font-medium mb-3">
                  You'll answer 3 quick questions about:
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Your experience level with {goalTitle}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Your confidence in doing it</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>How much support you need</span>
                  </li>
                </ul>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={onBack}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={() => setShowIntro(false)}
                  className="gap-2"
                  size="lg"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderQuestion = (question: Question) => {
    const questionTitle = question.title.replace('{goal}', goalTitle);
    const Icon = question.icon;
    const currentValue = responses[question.key];

    return (
      <div key={question.key} className="space-y-3">
        {/* Question Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-base">{questionTitle}</h3>
            <p className="text-sm text-muted-foreground">{question.subtitle}</p>
          </div>
        </div>

        {/* Radio Options */}
        <RadioGroup
          value={currentValue?.toString() || ''}
          onValueChange={(value) => handleResponseChange(question.key, value)}
          className="space-y-2"
        >
          {question.options.map((option, index) => (
            <Label
              key={index}
              htmlFor={`${question.key}-${index}`}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all',
                'hover:border-primary/50 hover:bg-primary/5',
                currentValue === index + 1 && 'border-primary bg-primary/10'
              )}
            >
              <RadioGroupItem 
                value={(index + 1).toString()} 
                id={`${question.key}-${index}`}
              />
              <span className="text-xl">{option.emoji}</span>
              <div className="flex-1">
                <div className="font-medium text-sm">{option.label}</div>
                <div className="text-xs text-muted-foreground">{option.description}</div>
              </div>
            </Label>
          ))}
        </RadioGroup>
      </div>
    );
  };

  const renderLivePreview = () => {
    if (!liveLevel) return null;

    return (
      <div className="sticky bottom-0 pt-4 pb-2 bg-background border-t mt-6">
        <div className="flex items-center justify-center gap-3 p-4 bg-primary/5 rounded-lg border-2 border-primary/20">
          <span className="text-sm font-medium text-muted-foreground">YOUR LEVEL:</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getLevelEmoji(liveLevel)}</span>
            <span className="text-lg font-bold text-primary">{liveLevelLabel}</span>
          </div>
        </div>
      </div>
    );
  };

  // Show intro screen first
  if (showIntro) {
    return renderIntroScreen();
  }

  return (
    <div className="min-h-[100dvh] bg-background p-4 md:p-8 animate-fade-in">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardContent className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <BackButton onClick={onBack} />
              <Badge variant="secondary">Skill Assessment</Badge>
            </div>

            {/* All Questions */}
            <div className="space-y-8">
              {questions.map(question => renderQuestion(question))}
            </div>

            {/* Live Preview */}
            {renderLivePreview()}

            {/* Footer Navigation */}
            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleComplete}
                disabled={!allQuestionsAnswered}
                size="lg"
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
