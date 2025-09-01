import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { 
  Target, 
  Clock, 
  CheckCircle2,
  ArrowLeft,
  Play
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { goalsService, stepsService } from '@/services/goalsService';
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
  
  // Get start date from wizard goal data or default to today
  const startDate = ('startDate' in goal && goal.startDate) ? goal.startDate : new Date();
  
  const { toast } = useToast();

  const categoryNames = {
    education: 'Education',
    employment: 'Employment', 
    independent_living: 'Independent Living',
    health: 'Health',
    social_skills: 'Social Skills'
  };

  const getGoalSpecificSteps = () => {
    // Check if this is a new wizard goal format
    const isWizardGoal = 'smartGoal' in goal;
    
    if (isWizardGoal) {
      const wizardGoal = goal as WizardGoalData;
      return [
        `${wizardGoal.details} ${wizardGoal.frequency} for ${wizardGoal.duration}`,
        'Track progress weekly',
        'Celebrate achievements',
        wizardGoal.supports.join(', ')
      ].filter(Boolean);
    }
    
    // Legacy format handling
    const extractedGoal = goal as ExtractedGoal;
    const goalTitle = extractedGoal.title?.toLowerCase() || '';
    
    if (goalTitle.includes('walk')) {
      const duration = extractedGoal.selectedOption || '10 minutes';
      const daysPerWeek = extractedGoal.followUps?.['Days per week'] || '3';
      return [
        `Put on comfortable walking shoes and go for a ${duration} walk`,
        `Track your walking progress - aim for ${daysPerWeek} days this week`,
        `Celebrate completing each walk - notice how you feel afterward`
      ];
    }
    
    if (goalTitle.includes('read')) {
      return [
        'Choose your reading material and set up a comfortable reading spot',
        'Set aside dedicated time each day for reading',
        'Track pages/chapters completed and reflect on what you learned'
      ];
    }
    
    if (goalTitle.includes('water')) {
      const cups = extractedGoal.selectedOption || '6 cups/day';
      return [
        `Fill a water bottle first thing in the morning`,
        `Set reminders to drink water throughout the day - target ${cups}`,
        'Track your daily water intake and notice energy improvements'
      ];
    }
    
    if (goalTitle.includes('sleep')) {
      return [
        'Set a consistent bedtime and stick to it for 7 days',
        'Create a calming pre-sleep routine (no screens 1 hour before bed)',
        'Track your sleep quality and morning energy levels'
      ];
    }
    
    // Default steps if no specific goal type is matched
    return extractedGoal.steps?.slice(0, 3) || [];
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
          case 'independent_living':
          case 'social_skills':
          default: return 'life';
        }
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
        domain: mapCategoryToDomain(goal.category),
        priority: 'medium',
        start_date: formatDate(startDate),
        due_date: formatDate(due),
      });

      // Create up to 3 steps for the micro-goal
      for (const stepTitle of getGoalSpecificSteps()) {
        await stepsService.createStep(createdGoal.id, {
          title: stepTitle,
          is_required: true,
        });
      }
      
      toast({
        title: 'Goal Created! 🎉',
        description: `Your ${wizardGoal?.goal || extractedGoal?.title || 'goal'} is ready to start!`,
      });
      
      onComplete();
    } catch (error) {
      console.error('Error creating goal:', error);
      toast({
        title: 'Error',
        description: 'Failed to create goal. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-soft p-4">
      <div className="max-w-md mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Goal Summary</h1>
            <p className="text-foreground-soft">Review and confirm your micro-goal</p>
          </div>
        </div>

        {/* Goal Overview */}
        <Card className="border-primary/20 bg-gradient-primary text-primary-foreground">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Target className="h-6 w-6" />
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

        {/* Suggested Steps */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Suggested Steps (≤3 for this week)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getGoalSpecificSteps().map((step, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center">
                    {index + 1}
                  </div>
                  <p className="text-sm text-foreground">{step}</p>
                </div>
              ))}
            </div>
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
                <Target className="h-5 w-5 text-encouraging" />
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