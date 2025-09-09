import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle2, ArrowRight, Calendar } from 'lucide-react';
import { format, isToday } from 'date-fns';
import type { Step, Goal } from '@/types';

interface TodaysFocusCardProps {
  step?: Step;
  goal?: Goal;
  upcomingSteps?: Array<{step: Step, goal: Goal, dueDate: Date}>;
  onCompleteStep?: () => void;
  onViewStep?: () => void;
  onNeedHelp?: () => void;
}

export const TodaysFocusCard: React.FC<TodaysFocusCardProps> = ({
  step,
  goal,
  upcomingSteps = [],
  onCompleteStep,
  onViewStep,
  onNeedHelp
}) => {
  // If there's a step due today
  if (step && goal) {
    const estimatedTime = step.estimated_effort_min 
      ? `${step.estimated_effort_min} min`
      : '5–7 min';

    return (
      <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
        <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <Clock className="h-4 w-4 text-primary-foreground" />
              </div>
              
              <div className="flex-1">
                <div className="mb-3">
                  <h3 className="font-semibold text-foreground mb-1">Today's Focus</h3>
                </div>
                
                <div className="flex items-start justify-between p-3 bg-background rounded-lg border border-border">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground text-sm">
                        {step.title}
                      </p>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                        {estimatedTime}
                      </span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      From "{goal.title}"
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
              </div>
            </div>
        </CardContent>
      </Card>
    );
  }

  // If nothing is due today, show upcoming steps
  return (
    <Card className="bg-gradient-to-r from-muted/5 to-muted/10 border-muted">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0 mt-1">
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </div>
          
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="font-semibold text-foreground mb-1">Today's Focus</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Nothing due today 🎉
              </p>
              
              {upcomingSteps.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Coming up:</p>
                  {upcomingSteps.map(({step, goal, dueDate}, index) => (
                    <div key={step.id} className="text-sm">
                      <p className="font-medium text-foreground">
                        {step.title}
                      </p>
                      <p className="text-muted-foreground">
                        From "{goal.title}" • Due {format(dueDate, 'MMM d')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
          </div>
        </div>
      </CardContent>
    </Card>
  );
};