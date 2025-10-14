import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Award, Brain, Sparkles, Rocket } from 'lucide-react';
import Lottie from 'lottie-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { BackButton } from '@/components/ui/back-button';
import { cn } from '@/lib/utils';
import { progressiveMasteryService } from '@/services/progressiveMasteryService';
import confettiAnimation from '@/assets/confetti-animation.json';

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
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<AssessmentResponses>({
    q1_familiarity: 0,
    q2_confidence: 0,
    q3_independence: 0
  });
  const [showResults, setShowResults] = useState(false);
  const [calculatedLevel, setCalculatedLevel] = useState(0);
  const [levelLabel, setLevelLabel] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);

  const currentQuestionData = questions[currentQuestion];
  const isLastQuestion = currentQuestion === questions.length - 1;
  const currentResponse = responses[currentQuestionData?.key];

  const handleResponseChange = (value: string) => {
    setResponses(prev => ({
      ...prev,
      [currentQuestionData.key]: parseInt(value)
    }));
  };

  const handleNext = () => {
    if (isLastQuestion) {
      // Calculate results
      const level = progressiveMasteryService.calculateSkillLevel({
        q1: responses.q1_familiarity,
        q2: responses.q2_confidence,
        q3: responses.q3_independence
      });

      const label = progressiveMasteryService.getSkillLevelLabel(level);

      setCalculatedLevel(level);
      setLevelLabel(label);
      setShowResults(true);
      setShowCelebration(true);

      setTimeout(() => setShowCelebration(false), 2000);
    } else {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (showResults) {
      setShowResults(false);
      setCurrentQuestion(questions.length - 1);
    } else if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    } else {
      onBack();
    }
  };

  const handleComplete = () => {
    const assessment: SkillAssessment = {
      calculated_level: calculatedLevel,
      level_label: levelLabel.toLowerCase().replace(/\s+/g, '_'),
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

  const getLevelDescription = (level: number): string => {
    switch (level) {
      case 1:
        return "We'll start with the basics and build your confidence step by step.";
      case 2:
        return "You have some awareness, so we'll guide you through fundamentals while building on what you know.";
      case 3:
        return "You're developing this skill! We'll help you practice and grow more independent.";
      case 4:
        return "You're proficient! We'll help you refine and master your technique.";
      case 5:
        return "You're already independent! We'll help you maintain and build on your strong foundation.";
      default:
        return "Let's work together to build this skill!";
    }
  };

  if (showResults) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8 animate-fade-in">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Award className="h-8 w-8 text-primary" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">Your Skill Level</h2>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
                    <span className="text-3xl">{getLevelEmoji(calculatedLevel)}</span>
                    <span className="text-xl font-semibold text-primary">
                      {levelLabel}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-card-soft rounded-lg text-left space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Based on your responses, we've assessed your current skill level as{' '}
                    <strong>{levelLabel}</strong>.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {getLevelDescription(calculatedLevel)}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{responses.q1_familiarity}</div>
                    <div className="text-xs text-muted-foreground">Experience</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{responses.q2_confidence}</div>
                    <div className="text-xs text-muted-foreground">Confidence</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{responses.q3_independence}</div>
                    <div className="text-xs text-muted-foreground">Independence</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={handleComplete} size="lg">
                  Continue with {levelLabel} Level
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {showCelebration && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center backdrop-blur-sm pointer-events-none">
            <div className="absolute inset-0 flex items-center justify-center">
              <Lottie
                animationData={confettiAnimation}
                loop={false}
                style={{ width: 300, height: 300 }}
              />
            </div>
            <div className="absolute top-1/2 left-0 right-0 text-center px-4 -mt-20">
              <h2 className="text-4xl font-bold text-white drop-shadow-lg mb-2">
                Assessment Complete! 🎉
              </h2>
              <p className="text-xl text-white/90 drop-shadow">
                You're a {levelLabel}!
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  const questionTitle = currentQuestionData.title.replace('{goal}', goalTitle);
  const Icon = currentQuestionData.icon;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 animate-fade-in">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-6 space-y-6">
            {/* Header */}
            <div className="space-y-4">
              <BackButton onClick={handleBack} />
              <div className="flex items-center justify-between">
                <Badge variant="secondary">Skill Assessment</Badge>
                <span className="text-sm text-muted-foreground">
                  Question {currentQuestion + 1} of {questions.length}
                </span>
              </div>
              <Progress 
                value={((currentQuestion + 1) / questions.length) * 100} 
                className="h-2" 
              />
            </div>

            {/* Question */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">{questionTitle}</h2>
              <p className="text-sm text-muted-foreground">
                {currentQuestionData.subtitle}
              </p>
            </div>

            {/* Options */}
            <RadioGroup
              value={currentResponse?.toString() || ''}
              onValueChange={handleResponseChange}
              className="space-y-3"
            >
              {currentQuestionData.options.map((option, index) => (
                <Label
                  key={index}
                  htmlFor={`option-${index}`}
                  className={cn(
                    'flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-smooth min-h-[56px]',
                    'hover:border-primary/50 hover:bg-primary/5',
                    currentResponse === index + 1 && 'border-primary bg-primary/10'
                  )}
                >
                  <RadioGroupItem 
                    value={(index + 1).toString()} 
                    id={`option-${index}`}
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="font-medium">{option.label}</div>
                    <div className="text-sm text-muted-foreground">
                      {option.description}
                    </div>
                  </div>
                  <span className="text-2xl">{option.emoji}</span>
                </Label>
              ))}
            </RadioGroup>

            {/* Navigation */}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {currentQuestion === 0 ? 'Cancel' : 'Back'}
              </Button>

              <Button
                onClick={handleNext}
                disabled={!currentResponse}
              >
                {isLastQuestion ? 'See Results' : 'Next'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
