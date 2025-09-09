import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, ArrowRight, Clock, AlertTriangle } from 'lucide-react';
import { format, isBefore } from 'date-fns';
import type { Step, Goal } from '@/types';
import { cleanStepTitle } from '@/utils/stepUtils';


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
          Coming Up
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {upcomingSteps.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming steps scheduled.</p>
        ) : (
          upcomingSteps.map(({step, goal, dueDate}, index) => {
            const isOverdue = step.status !== 'done' && 
                            step.status !== 'skipped' && 
                            isBefore(dueDate, new Date().setHours(0, 0, 0, 0));
            
            return (
            <div key={step.id} className={`flex items-center justify-between p-3 bg-background rounded-lg border ${
              isOverdue ? 'border-red-200 bg-red-50' : 'border-border'
            }`}>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground text-sm">
                      {cleanStepTitle(step.title)}
                    </h4>
                  </div>
                  {isOverdue && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-800 bg-red-100 rounded-md">
                      <AlertTriangle className="h-3 w-3" />
                      OVERDUE
                    </span>
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground">
                  Goal: {goal.title}
                </p>
                
                <p className={`text-sm flex items-center gap-1 ${
                  isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'
                }`}>
                  <Clock className="h-3 w-3" />
                  Due {format(dueDate, 'MMM d, yyyy')}
                </p>
              </div>
              
              {onViewStep && (
                <Button 
                  size="sm" 
                  onClick={() => onViewStep(step.id, goal.id)}
                  className="ml-2"
                  style={{ backgroundColor: '#2393CC', color: 'white' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1e7bb8'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2393CC'}
                >
                  View
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