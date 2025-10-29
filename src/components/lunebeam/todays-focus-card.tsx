import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Calendar } from 'lucide-react';
import { format, isToday, parseISO } from 'date-fns';
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
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow border-0 shadow-md"
      onClick={() => onViewUpcomingStep?.(step.id, goal.id)}
    >
      <CardHeader className="pb-3">
        <h4 className="font-medium text-foreground text-base">
          {cleanStepTitle(step.title)}
        </h4>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-1">
        <p className="text-sm text-muted-foreground">
          Goal: {goal.title}
        </p>
        
        {dueDate && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className={isOverdue ? 'text-red-500 font-medium' : ''}>
              Due {format(dueDate, 'MMM d, yyyy')}
            </span>
          </div>
        )}
        
        {step.explainer && (
          <p className="text-xs text-muted-foreground">
            {step.explainer}
          </p>
        )}
      </CardContent>
    </Card>
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
            <Card className="cursor-pointer hover:shadow-lg transition-shadow border-0 shadow-md" onClick={onViewStep}>
              <CardHeader className="pb-3">
                <h4 className="font-medium text-foreground text-base">
                  {cleanStepTitle(step.title)}
                </h4>
              </CardHeader>
              
              <CardContent className="pt-0 space-y-1">
                <p className="text-sm text-muted-foreground">
                  Goal: {goal.title}
                </p>
                
                {step.due_date && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Due {format(parseISO(step.due_date), 'MMM d, yyyy')}
                    </span>
                  </div>
                )}
                
                {step.explainer && (
                  <p className="text-xs text-muted-foreground">
                    {step.explainer}
                  </p>
                )}
              </CardContent>
            </Card>
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
                <Card 
                  key={step.id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow border-0 shadow-md"
                  onClick={() => onViewUpcomingStep?.(step.id, goal.id)}
                >
                  <CardHeader className="pb-3">
                    <h4 className="font-medium text-foreground text-base">
                      {cleanStepTitle(step.title)}
                    </h4>
                  </CardHeader>
                  
                  <CardContent className="pt-0 space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Goal: {goal.title}
                    </p>
                    
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Due {format(dueDate, 'MMM d, yyyy')}
                      </span>
                    </div>
                    
                    {step.explainer && (
                      <p className="text-xs text-muted-foreground">
                        {step.explainer}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};