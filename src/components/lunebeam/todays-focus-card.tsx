import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle2, ArrowRight, Calendar } from 'lucide-react';
import { format, isToday } from 'date-fns';
import type { Step, Goal } from '@/types';
import { cleanStepTitle } from '@/utils/stepUtils';


interface TodaysFocusCardProps {
  step?: Step;
  goal?: Goal;
  upcomingSteps?: Array<{step: Step, goal: Goal, dueDate: Date}>;
  onCompleteStep?: () => void;
  onViewStep?: () => void;
  onNeedHelp?: () => void;
  onViewUpcomingStep?: (stepId: string, goalId: string) => void;
}

export const TodaysFocusCard: React.FC<TodaysFocusCardProps> = ({
  step,
  goal,
  upcomingSteps = [],
  onCompleteStep,
  onViewStep,
  onNeedHelp,
  onViewUpcomingStep
}) => {
  // If there's a step due today
  if (step && goal) {
    return (
      <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Clock className="h-5 w-5 text-blue-600" />
            Today's Focus
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <h4 className="font-medium text-foreground text-sm">
                    {cleanStepTitle(step.title)}
                  </h4>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground">
                Goal: {goal.title}
              </p>
              
              {step.explainer && (
                <p className="text-sm text-muted-foreground">
                  {step.explainer}
                </p>
              )}
            </div>
            
            <Button 
              size="sm" 
              onClick={onViewStep}
              className="ml-2"
              style={{ backgroundColor: '#2393CC', color: 'white' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1e7bb8'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2393CC'}
            >
              View
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If nothing is due today, show upcoming steps
  return (
    <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Calendar className="h-5 w-5 text-blue-600" />
          Today's Focus
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Nothing due today 🎉
        </p>
        
        {upcomingSteps.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Coming up:</p>
            {upcomingSteps.map(({step, goal, dueDate}, index) => (
              <div 
                key={step.id} 
                className="text-sm cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors"
                onClick={() => onViewUpcomingStep?.(step.id, goal.id)}
              >
                <p className="font-medium text-foreground">
                  {cleanStepTitle(step.title)}
                </p>
                <p className="text-muted-foreground">
                  Goal: {goal.title} • Due {format(dueDate, 'MMM d')}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};