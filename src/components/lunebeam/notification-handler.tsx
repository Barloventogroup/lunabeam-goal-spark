import React, { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { Goal } from '@/types';

interface NotificationHandlerProps {
  goals: Goal[];
  onSnooze: (goalId: string, duration: '15m' | '1h') => void;
  onSkip: (goalId: string) => void;
  onMakeSmaller: (goalId: string) => void;
  onMoveToTomorrow: (goalId: string) => void;
  onDismiss: (goalId: string) => void;
}

export const NotificationHandler: React.FC<NotificationHandlerProps> = ({
  goals,
  onSnooze,
  onSkip,
  onMakeSmaller,
  onMoveToTomorrow,
  onDismiss
}) => {
  const { toast } = useToast();

  useEffect(() => {
    const checkDueGoals = () => {
      const now = new Date();
      
      goals.forEach(goal => {
        if (goal.due_date && goal.status === 'active') {
          const dueDateTime = new Date(goal.due_date);
          const timeDiff = now.getTime() - dueDateTime.getTime();
          
          // Due now notification
          if (timeDiff >= 0 && timeDiff < 86400000) { // Within 24 hours
            toast({
              title: `Heads up ⏱`,
              description: `Your "${goal.title}" is due now. Want to do it together?`,
              action: (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => onSkip(goal.id)}>
                    ✅ I'm on it
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onSnooze(goal.id, '15m')}>
                    🔁 Later
                  </Button>
                </div>
              ),
            });
          }
        }
      });
    };

    const interval = setInterval(checkDueGoals, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [goals, toast, onSnooze, onSkip, onMakeSmaller]);

  // For demo purposes, show notification UI for any paused goals
  const pausedGoals = goals.filter(goal => goal.status === 'paused');

  if (pausedGoals.length === 0) return null;

  return (
    <div className="space-y-4 mb-6">
      {pausedGoals.map(goal => (
        <Card key={goal.id} className="p-4 border-red-200 bg-red-50/50">
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium text-foreground">Missed a step? No worries.</h4>
              <p className="text-sm text-muted-foreground">We can keep it light for "{goal.title}". Pick one:</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button 
                size="sm"
                variant="outline" 
                onClick={() => onMoveToTomorrow(goal.id)}
                className="flex items-center gap-1"
              >
                📅 Move to tomorrow
              </Button>
              
              <Button 
                size="sm"
                variant="outline" 
                onClick={() => onMakeSmaller(goal.id)}
                className="flex items-center gap-1"
              >
                🌱 Make it smaller
              </Button>
              
              <Button 
                size="sm"
                variant="outline" 
                onClick={() => onDismiss(goal.id)}
                className="flex items-center gap-1"
              >
                🚪 Dismiss
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};