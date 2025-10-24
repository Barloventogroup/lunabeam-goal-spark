import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { 
  Target, 
  Clock, 
  CheckCircle2,
  
  Play,
  HelpCircle,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { goalsService, stepsService } from '@/services/goalsService';
import { AIService } from '@/services/aiService';
import type { GoalDomain } from '@/types';

interface ExtractedGoal {
  title: string;
  description: string;
  category: string;
  steps: string[];
  timeEstimate: string;
  selectedOption?: string;
  followUps?: Record<string, string>;
}

interface WizardGoalData {
  category: string;
  goal: string;
  purpose: string;
  details: string;
  frequency: string;
  duration: string;
  supports: string[];
  smartGoal: string;
  startDate?: Date;
}

interface GoalSummaryProps {
  goal: ExtractedGoal | WizardGoalData;
  onBack: () => void;
  onComplete: () => void;
}

export const GoalSummary: React.FC<GoalSummaryProps> = ({ 
  goal, 
  onBack, 
  onComplete 
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [microSteps, setMicroSteps] = useState<string[]>([]);
  const [isLoadingSteps, setIsLoadingSteps] = useState(true);
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>({});
  const [showBreakdown, setShowBreakdown] = useState(false);
  
  // Get start date from wizard goal data or default to today
  const startDate = ('startDate' in goal && goal.startDate) ? goal.startDate : new Date();
  
  const { toast } = useToast();

  const categoryNames = {
    education: 'Education - High School / Academic Readiness',
    employment: 'Employment', 
    independent_living: 'Independent Living',
    health: 'Health & Well-Being',
    social_skills: 'Social Skills'
  };

  // Load AI-generated micro steps on component mount
  useEffect(() => {
    const generateMicroSteps = async () => {
      try {
        const isWizardGoal = 'smartGoal' in goal;
        const goalTitle = isWizardGoal ? (goal as WizardGoalData).goal : (goal as ExtractedGoal).title;
        const goalDescription = isWizardGoal ? (goal as WizardGoalData).smartGoal : (goal as ExtractedGoal).description;
        const frequency = isWizardGoal ? (goal as WizardGoalData).frequency : '';
        const duration = isWizardGoal ? (goal as WizardGoalData).duration : '';
        
        const response = await AIService.getCoachingGuidance({
          question: `Generate 3 specific micro preparation steps for this goal. These should be actionable preparation tasks that help set up for success, not the goal execution itself. Focus on what needs to be prepared or organized before starting:

Goal: ${goalTitle}
Description: ${goalDescription}
Frequency: ${frequency}
Duration: ${duration}
Category: ${goal.category}

Return only 3 concise preparation steps, each starting with an action verb. Each step should be something that can be checked off before beginning the goal.`,
          mode: 'goal_setting'
        });

        if (response?.suggestions) {
          const steps = response.suggestions.split('\n')
            .filter((step: string) => step.trim())
            .slice(0, 3)
            .map((step: string) => step.replace(/^\d+\.\s*/, '').trim());
          setMicroSteps(steps);
        }
      } catch (error) {
        console.error('Error generating micro steps:', error);
        // Fallback to default steps if AI fails
        setMicroSteps([
          "Set up your workspace and tools",
          "Schedule time in your calendar", 
          "Prepare any materials needed"
        ]);
      } finally {
        setIsLoadingSteps(false);
      }
    };

    generateMicroSteps();
  }, [goal]);

  const handleStepCheck = (stepIndex: number, checked: boolean) => {
    setCheckedSteps(prev => ({
      ...prev,
      [stepIndex]: checked
    }));
  };

  const requestStepBreakdown = async (step: string) => {
    try {
      const response = await AIService.getCoachingGuidance({
        question: `Break down this preparation step into 2-3 smaller, more specific micro-tasks: "${step}". Make each sub-task very specific and actionable.`,
        mode: 'assist'
      });
      
      if (response?.suggestions) {
        toast({
          title: 'Here\'s how to break it down',
          description: response.suggestions,
        });
      }
    } catch (error) {
      console.error('Error breaking down step:', error);
      toast({
        title: 'Hmm, that didn\'t work',
        description: 'Try breaking down that step again when you\'re ready',
        variant: 'destructive'
      });
    }
  };

  const getNextWeekDates = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const createGoal = async () => {
    setIsCreating(true);
    
    try {
      const mapCategoryToDomain = (cat: string): GoalDomain => {
        switch (cat) {
          case 'education': return 'school';
          case 'employment': return 'work';
          case 'health': return 'health';
          case 'independent_living': return 'life';
          case 'social_skills': return 'life'; // Map social skills to life domain
          case 'fun_recreation': return 'life'; // Map fun/recreation to life domain
          default: return 'life';
        }
      };

      const mapStarterGoalToDomain = (goalTitle: string): GoalDomain => {
        const titleLower = goalTitle.toLowerCase();
        if (titleLower.includes('water')) return 'health';
        if (titleLower.includes('bed')) return 'life';
        if (titleLower.includes('hi')) return 'life'; // Map social to life domain
        if (titleLower.includes('music')) return 'life'; // Map recreation to life domain
        return 'life';
      };

      const formatDate = (d: Date) => d.toISOString().slice(0, 10);
      const due = new Date(startDate);
      due.setDate(due.getDate() + 6);

      // Create the goal in Supabase
      const isWizardGoal = 'smartGoal' in goal;
      const wizardGoal = isWizardGoal ? goal as WizardGoalData : null;
      const extractedGoal = isWizardGoal ? null : goal as ExtractedGoal;
      
      const createdGoal = await goalsService.createGoal({
        title: wizardGoal?.goal || extractedGoal?.title || 'Goal',
        description: wizardGoal?.smartGoal || extractedGoal?.description || 'Generated goal',
        domain: goal.category === 'starter' ? mapStarterGoalToDomain(wizardGoal?.goal || extractedGoal?.title || '') : mapCategoryToDomain(goal.category),
        priority: 'medium',
        start_date: formatDate(startDate),
        due_date: formatDate(due),
      });

      // Create up to 3 steps for the micro-goal using AI-generated steps
      for (const stepTitle of microSteps) {
        await stepsService.createStep(createdGoal.id, {
          title: stepTitle,
          is_required: true,
        });
      }
      
      toast({
        title: 'Goal Created! 🎉',
        description: `Your ${wizardGoal?.goal || extractedGoal?.title || 'goal'} is ready to go!`,
      });
      
      onComplete();
    } catch (error) {
      console.error('Error creating goal:', error);
      toast({
        title: 'Oops!',
        description: 'Something went wrong creating your goal. Mind giving it another shot?',
        variant: 'destructive'
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-soft p-4">
      <div className="max-w-md mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <BackButton onClick={onBack} />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Goal Summary</h1>
            <p className="text-foreground-soft">Review and confirm your micro-goal</p>
          </div>
        </div>

        {/* Goal Overview */}
        <Card className="border-primary/20 bg-gradient-primary text-primary-foreground">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <CardTitle className="text-xl">
                  {'smartGoal' in goal ? (goal as WizardGoalData).goal : (goal as ExtractedGoal).title}
                </CardTitle>
                <Badge variant="secondary" className="mt-1">
                  {categoryNames[goal.category as keyof typeof categoryNames]}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-primary-foreground/90 leading-relaxed">
              {'smartGoal' in goal ? (goal as WizardGoalData).smartGoal : (goal as ExtractedGoal).description}
            </p>
          </CardContent>
        </Card>

        {/* Preparation Steps */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Preparation Steps
            </CardTitle>
            <p className="text-sm text-muted-foreground">Complete these micro-tasks before starting your goal</p>
          </CardHeader>
          <CardContent>
            {isLoadingSteps ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">Generating personalized steps...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {microSteps.map((step, index) => (
                  <div key={index} className="flex items-start gap-3 group">
                    <Checkbox 
                      id={`step-${index}`}
                      checked={checkedSteps[index] || false}
                      onCheckedChange={(checked) => handleStepCheck(index, checked === true)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <label 
                        htmlFor={`step-${index}`} 
                        className="text-sm text-foreground cursor-pointer block"
                      >
                        {step}
                      </label>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => requestStepBreakdown(step)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                      title="Break down this step further"
                    >
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    💡 Hover over the help icon next to any step to break it down further
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Time commitment:</span>
                <Badge variant="outline">
                  {'smartGoal' in goal ? `${(goal as WizardGoalData).frequency} for ${(goal as WizardGoalData).duration}` : (goal as ExtractedGoal).timeEstimate}
                </Badge>
              </div>
              
              <div className="grid grid-cols-7 gap-2">
                {getNextWeekDates().map((date, index) => (
                  <div key={index} className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">
                      {date.toLocaleDateString('en', { weekday: 'short' })}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center">
                      {date.getDate()}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="text-center text-sm text-muted-foreground">
                Start Date: {startDate.toLocaleDateString('en', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Success Criteria */}
        <Card className="bg-encouraging-soft/20 border-encouraging/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-encouraging/10 flex items-center justify-center">
              </div>
              <div>
                <p className="font-medium text-encouraging">Success Goal</p>
                <p className="text-sm text-encouraging/80">
                  Complete at least 3 attempts this week
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Start Button */}
        <div className="space-y-4">
          <Button 
            onClick={createGoal}
            disabled={isCreating}
            size="lg"
            className="w-full"
          >
            {isCreating ? (
              "Creating Goal..."
            ) : (
              <>
                <Play className="h-5 w-5 mr-2" />
                Start My Goal
              </>
            )}
          </Button>
          
          <p className="text-center text-sm text-muted-foreground">
            You can modify or pause this goal anytime from your dashboard
          </p>
        </div>
      </div>
    </div>
  );
};