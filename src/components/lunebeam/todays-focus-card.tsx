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
  overdueSteps?: Array<{step: Step, goal: Goal, dueDate: Date}>;
  upcomingSteps?: Array<{step: Step, goal: Goal, dueDate: Date}>;
  onCompleteStep?: () => void;
  onViewStep?: () => void;
  onNeedHelp?: () => void;
  onViewUpcomingStep?: (stepId: string, goalId: string) => void;
}

export const TodaysFocusCard: React.FC<TodaysFocusCardProps> = ({
  step,
  goal,
  overdueSteps = [],
  upcomingSteps = [],
  onCompleteStep,
  onViewStep,
  onNeedHelp,
  onViewUpcomingStep
}) => {
  const renderStepCard = (step: Step, goal: Goal, dueDate?: Date, isOverdue = false) => (
    <div className={`flex items-center justify-between p-3 bg-background rounded-lg ${isOverdue ? 'border-2 border-red-500' : 'border border-border'}`}>
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
        
        {dueDate && (
          <p className={`text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
            Due {format(dueDate, 'MMM d, yyyy')}
          </p>
        )}
        
        {step.explainer && (
          <p className="text-sm text-muted-foreground">
            {step.explainer}
          </p>
        )}
      </div>
      
      <Button 
        size="sm" 
        onClick={() => onViewUpcomingStep?.(step.id, goal.id)}
        className="ml-2"
        style={{ backgroundColor: '#2393CC', color: 'white' }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1e7bb8'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2393CC'}
      >
        View
      </Button>
    </div>
  );

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Clock className="h-5 w-5 text-blue-600" />
          Today's Focus
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Today's Due Step */}
        {step && goal && (
          <div className="space-y-3">
            <h5 className="text-sm font-semibold text-foreground">Due Today:</h5>
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
          </div>
        )}

        {/* Overdue Steps */}
        {overdueSteps.length > 0 && (
          <div className="space-y-3">
            <h5 className="text-lg font-bold text-foreground">Missed Steps</h5>
            <div className="space-y-2">
              {overdueSteps.map(({step, goal, dueDate}) => (
                <div key={step.id}>
                  {renderStepCard(step, goal, dueDate, true)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No steps due today message */}
        {!step && overdueSteps.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nothing due today 🎉
          </p>
        )}
        
        {/* Coming Up Steps (Non-clickable) */}
        {upcomingSteps.length > 0 && (
          <div className="space-y-3">
            <h5 className="text-lg font-bold text-foreground">Coming Up</h5>
            <div className="space-y-2">
              {upcomingSteps.map(({step, goal, dueDate}) => (
                <div key={step.id} className="p-3 rounded-md bg-white/80 shadow-sm">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground text-sm">
                          {cleanStepTitle(step.title)}
                        </h4>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Goal: {goal.title} • Due {format(dueDate, 'MMM d')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};