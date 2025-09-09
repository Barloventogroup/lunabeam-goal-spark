import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, ArrowRight, Clock } from 'lucide-react';
import { format } from 'date-fns';
import type { Step, Goal } from '@/types';

interface UpcomingStepsCardProps {
  upcomingSteps: Array<{step: Step, goal: Goal, dueDate: Date}>;
  onViewStep?: (stepId: string, goalId: string) => void;
}

export const UpcomingStepsCard: React.FC<UpcomingStepsCardProps> = ({
  upcomingSteps,
  onViewStep
}) => {

  return (
    <Card className="bg-gradient-to-r from-muted/5 to-accent/5 border-muted">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          Upcoming Steps
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {upcomingSteps.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming steps scheduled.</p>
        ) : (
          upcomingSteps.map(({step, goal, dueDate}, index) => {
            const estimatedTime = step.estimated_effort_min 
              ? `${step.estimated_effort_min} min`
              : '5–7 min';

            return (
              <div key={step.id} className="flex items-start justify-between p-3 bg-background rounded-lg border border-border">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-foreground text-sm">
                      {step.title}
                    </h4>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {estimatedTime}
                    </span>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    From "{goal.title}"
                  </p>
                  
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Due {format(dueDate, 'MMM d, yyyy')}
                  </p>
                </div>
                
                {onViewStep && (
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => onViewStep(step.id, goal.id)}
                    className="ml-2 h-8 w-8 p-0"
                  >
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};