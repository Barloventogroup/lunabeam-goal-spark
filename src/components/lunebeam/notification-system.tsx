import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/store/useStore';

interface NotificationSystemProps {
  goals: any[];
  onSnoozeGoal?: (goalId: string) => void;
  onSkipGoal?: (goalId: string) => void;
  onMakeSmallerGoal?: (goalId: string) => void;
  onMoveToTomorrow?: (goalId: string) => void;
  onDismissGoal?: (goalId: string) => void;
}

export const NotificationSystem: React.FC<NotificationSystemProps> = ({
  goals,
  onSnoozeGoal,
  onSkipGoal,
  onMakeSmallerGoal,
  onMoveToTomorrow,
  onDismissGoal
}) => {
  const { toast } = useToast();
  const { profile } = useStore();

  useEffect(() => {
    // Check for due goals every minute
    const checkDueGoals = () => {
      const now = new Date();
      const dueGoals = goals.filter(goal => {
        if (!goal.due_date) return false;
        const dueDate = new Date(goal.due_date);
        const timeDiff = dueDate.getTime() - now.getTime();
        return timeDiff <= 0 && timeDiff > -60000; // Due within the last minute
      });

      dueGoals.forEach(goal => {
        const userName = profile?.first_name || 'friend';
        toast({
          title: `Hey ${userName} ⏱`,
          description: `Your "${goal.title}" is due now. Want to do it together?`,
          action: (
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={() => {
                  // Navigate to goal or start it
                  console.log('Starting goal:', goal.id);
                }}
              >
                Let's go
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onSnoozeGoal?.(goal.id)}
              >
                Snooze
              </Button>
            </div>
          ),
        });
      });

      // Check for goals that should get a nudge (1 hour overdue)
      const overdueGoals = goals.filter(goal => {
        if (!goal.due_date) return false;
        const dueDate = new Date(goal.due_date);
        const timeDiff = now.getTime() - dueDate.getTime();
        return timeDiff >= 3600000 && timeDiff < 3660000; // 1 hour overdue, within 1 minute window
      });

      overdueGoals.forEach(goal => {
        const userName = profile?.first_name || 'friend';
        toast({
          title: `Quick check 💬`,
          description: `Want to try a smaller version of "${goal.title}" today?`,
          action: (
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={() => onMakeSmallerGoal?.(goal.id)}
              >
                Make smaller
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onMoveToTomorrow?.(goal.id)}
              >
                Tomorrow
              </Button>
            </div>
          ),
        });
      });
    };

    const interval = setInterval(checkDueGoals, 60000); // Check every minute
    checkDueGoals(); // Check immediately

    return () => clearInterval(interval);
  }, [goals, profile, toast, onSnoozeGoal, onMakeSmallerGoal, onMoveToTomorrow]);

  // Handle overdue goals (end of day)
  const overdueGoals = goals.filter(goal => {
    if (!goal.due_date || goal.status === 'completed') return false;
    const dueDate = new Date(goal.due_date);
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    
    return dueDate < now && goal.status !== 'completed';
  });

  if (overdueGoals.length === 0) return null;

  return (
    <div className="space-y-4 mb-6">
      {overdueGoals.map(goal => (
        <Card key={goal.id} className="p-4 border-red-200 bg-red-50/50">
          <div className="space-y-3">
            <p className="text-sm text-foreground">
              It happens ❤️ Want to move "{goal.title}" to tomorrow or make it smaller?
            </p>
            <div className="flex flex-wrap gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onMoveToTomorrow?.(goal.id)}
                className="flex items-center gap-1"
              >
                📅 Tomorrow
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onMakeSmallerGoal?.(goal.id)}
                className="flex items-center gap-1"
              >
                🌱 Smaller step
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  // Open time picker
                  console.log('Pick new time for goal:', goal.id);
                }}
                className="flex items-center gap-1"
              >
                🗓 Pick new time
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onDismissGoal?.(goal.id)}
                className="flex items-center gap-1"
              >
                🚪 Exit
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};