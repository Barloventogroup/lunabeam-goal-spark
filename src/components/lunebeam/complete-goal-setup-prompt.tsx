import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, X } from 'lucide-react';
import type { Goal } from '@/types';

interface CompleteGoalSetupPromptProps {
  goal: Goal;
  userName?: string;
  onStartSetup: (goalId: string) => void;
  onDismiss: () => void;
}

export const CompleteGoalSetupPrompt: React.FC<CompleteGoalSetupPromptProps> = ({
  goal,
  userName,
  onStartSetup,
  onDismiss
}) => {
  return (
    <Card className="relative bg-gradient-to-br from-primary/5 via-background to-secondary/5 border-2 border-primary/20 shadow-lg">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-8 w-8"
        onClick={onDismiss}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Dismiss</span>
      </Button>

      <CardContent className="pt-6 pb-6 px-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          {/* Icon */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Target className="h-6 w-6 text-primary" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-3">
            <h3 className="text-lg font-semibold">
              {userName ? `Hey ${userName}, l` : 'L'}et's finish setting up your goal
            </h3>
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">"{goal.title}"</span> is ready to go! 
              We'll break it down into simple steps that work for you.
            </p>
            <Button 
              onClick={() => onStartSetup(goal.id)}
              className="mt-2"
            >
              Continue Setup
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
