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
            
            <div className="flex-1 space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground">Today's Focus</h3>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                    {estimatedTime}
                  </span>
                </div>
                
                <p className="text-sm text-muted-foreground mb-2">
                  From "{goal.title}"
                </p>
                
                <p className="font-medium text-foreground">
                  {step.title}
                </p>
                
                {step.explainer && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {step.explainer}
                  </p>
                )}
              </div>
              
              <div className="flex gap-2 flex-wrap">
                <Button 
                  size="sm" 
                  onClick={onCompleteStep}
                  className="bg-primary hover:bg-primary/90"
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Complete
                </Button>
                
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={onViewStep}
                >
                  View Details
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
                
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={onNeedHelp}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Need help?
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