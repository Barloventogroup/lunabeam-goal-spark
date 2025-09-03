import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Target, Plus, Calendar } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { ProgressRing } from '@/components/ui/progress-ring';
import type { Goal } from '@/types';

interface ThisWeeksGoalsProps {
  onGoalClick: (goalId: string) => void;
}

export const ThisWeeksGoals: React.FC<ThisWeeksGoalsProps> = ({ onGoalClick }) => {
  const { goals, loadGoals } = useStore();
  const [thisWeekGoals, setThisWeekGoals] = useState<Goal[]>([]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  useEffect(() => {
    // Filter goals due this week (Monday to Sunday)
    const now = new Date();
    const startOfWeek = new Date(now);
    const dayOfWeek = startOfWeek.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert Sunday=0 to Monday=0
    startOfWeek.setDate(startOfWeek.getDate() - daysToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const weekGoals = goals.filter(goal => {
      if (!goal.due_date) return false;
      const dueDate = new Date(goal.due_date);
      return dueDate >= startOfWeek && dueDate <= endOfWeek && goal.status === 'active';
    });

    setThisWeekGoals(weekGoals);
  }, [goals]);

  const getDomainColor = (domain?: string) => {
    switch (domain) {
      case 'school': return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'work': return 'bg-green-500/10 text-green-700 border-green-200';
      case 'health': return 'bg-red-500/10 text-red-700 border-red-200';
      case 'life': return 'bg-purple-500/10 text-purple-700 border-purple-200';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const getDayName = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">This Week's Goals</h2>
        {thisWeekGoals.length > 0 && (
          <span className="text-sm text-muted-foreground">
            {thisWeekGoals.length} goal{thisWeekGoals.length === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {thisWeekGoals.length === 0 ? (
        // Empty state
        <Card className="border-dashed border-2 border-muted-foreground/25">
          <CardContent className="p-8 text-center">
            <h3 className="font-medium mb-2">Nothing due this week</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Want to plan a goal for this week?
            </p>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Goal
            </Button>
          </CardContent>
        </Card>
      ) : (
        // Goals carousel
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
          {thisWeekGoals.map((goal) => (
            <Card 
              key={goal.id}
              className="flex-shrink-0 w-72 cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
              onClick={() => onGoalClick(goal.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Progress Ring */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {goal.progress_pct}%
                    </div>
                  </div>

                  {/* Goal Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium leading-tight mb-2 line-clamp-2">
                      {goal.title}
                    </h3>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {goal.due_date ? getDayName(goal.due_date) : 'No due date'}
                      </span>
                    </div>

                    {goal.domain && (
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getDomainColor(goal.domain)}`}
                      >
                        {goal.domain.charAt(0).toUpperCase() + goal.domain.slice(1)}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Progress text */}
                <div className="mt-3 text-xs text-muted-foreground">
                  {goal.progress_pct}% complete
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};