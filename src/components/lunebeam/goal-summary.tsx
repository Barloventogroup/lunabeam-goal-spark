import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  Clock, 
  Calendar,
  CheckCircle2,
  ArrowLeft,
  Play
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useToast } from '@/hooks/use-toast';

interface ExtractedGoal {
  title: string;
  description: string;
  category: string;
  steps: string[];
  timeEstimate: string;
}

interface GoalSummaryProps {
  goal: ExtractedGoal;
  onBack: () => void;
  onComplete: () => void;
}

export const GoalSummary: React.FC<GoalSummaryProps> = ({ 
  goal, 
  onBack, 
  onComplete 
}) => {
  const [startDate, setStartDate] = useState(new Date());
  const [isCreating, setIsCreating] = useState(false);
  const { addGoal } = useStore();
  const { toast } = useToast();

  const categoryNames = {
    education: 'Education',
    employment: 'Employment', 
    independent_living: 'Independent Living',
    health: 'Health',
    social_skills: 'Social Skills'
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
      const goalData = {
        title: goal.title,
        status: 'active' as const,
        data_to_track: ['count_of_attempts', 'minutes_spent', 'confidence_1_5'] as ('count_of_attempts' | 'minutes_spent' | 'confidence_1_5')[],
        week_plan: {
          steps: goal.steps.slice(0, 3), // Max 3 steps for micro-goal
          time_per_day: goal.timeEstimate,
          success_criteria: ['Complete at least 3 attempts this week'],
          too_hard_try: ['Reduce time commitment', 'Focus on just one step', 'Ask for help']
        },
        check_ins: {
          frequency: 'daily' as const,
          method: 'in_app' as const,
          encourager: 'self' as const
        },
        rewards: {
          type: 'badge' as const,
          criteria: 'milestone_complete' as const,
          badge_tier: 'silver' as const,
          proof_required: false,
          accepted_proof_types: ['photo', 'video'] as ('photo' | 'video' | 'doc')[],
          custom_label: `${goal.category} achiever`
        }
      };

      await addGoal(goalData);
      
      toast({
        title: "Goal Created! 🎉",
        description: `Your ${goal.title} goal is ready to start!`,
      });
      
      onComplete();
    } catch (error) {
      console.error('Error creating goal:', error);
      toast({
        title: "Error",
        description: "Failed to create goal. Please try again.",
        variant: "destructive"
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
            <p className="text-foreground-soft">Review and confirm your 7-day micro-goal</p>
          </div>
        </div>

        {/* Goal Overview */}
        <Card className="border-primary/20 bg-gradient-primary text-primary-foreground">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Target className="h-6 w-6" />
              <div className="flex-1">
                <CardTitle className="text-xl">{goal.title}</CardTitle>
                <Badge variant="secondary" className="mt-1">
                  {categoryNames[goal.category as keyof typeof categoryNames]}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-primary-foreground/90 leading-relaxed">
              {goal.description}
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
              {goal.steps.slice(0, 3).map((step, index) => (
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
              7-Day Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Time commitment:</span>
                <Badge variant="outline">{goal.timeEstimate}</Badge>
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
                Start My 7-Day Goal
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