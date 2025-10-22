import React, { useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Goal, Step } from '@/types';
import { format, parseISO, startOfDay, isAfter, isBefore, isSameDay, addDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface GoalCalendarViewProps {
  goal: Goal;
  steps: Step[];
}

export const GoalCalendarView: React.FC<GoalCalendarViewProps> = ({ goal, steps }) => {
  // Calculate dates for calendar display
  const { plannedDates, completedDates, missedDates } = useMemo(() => {
    const planned: Date[] = [];
    const completed: Date[] = [];
    const missed: Date[] = [];

    // Get planned dates from metadata or date range
    if (goal.metadata?.plannedOccurrences && Array.isArray(goal.metadata.plannedOccurrences)) {
      goal.metadata.plannedOccurrences.forEach((dateStr: string) => {
        try {
          planned.push(startOfDay(parseISO(dateStr)));
        } catch (e) {
          console.error('Failed to parse planned occurrence:', dateStr);
        }
      });
    } else if (goal.start_date && goal.due_date) {
      // For non-habit goals, generate daily dates between start and end
      let currentDate = startOfDay(parseISO(goal.start_date));
      const endDate = startOfDay(parseISO(goal.due_date));
      while (isBefore(currentDate, endDate) || isSameDay(currentDate, endDate)) {
        planned.push(currentDate);
        currentDate = addDays(currentDate, 1);
      }
    }

    // Get completed dates from steps
    const completedSet = new Set<string>();
    steps
      .filter(step => step.status === 'done' && step.updated_at)
      .forEach(step => {
        try {
          const completedDate = startOfDay(parseISO(step.updated_at));
          const dateKey = format(completedDate, 'yyyy-MM-dd');
          completedSet.add(dateKey);
          completed.push(completedDate);
        } catch (e) {
          console.error('Failed to parse completion date:', step.updated_at);
        }
      });

    // Calculate missed dates (planned dates in the past without completion)
    const today = startOfDay(new Date());
    const gracePeriod = addDays(today, -1); // 24-hour grace period

    planned.forEach(plannedDate => {
      if (isBefore(plannedDate, gracePeriod)) {
        const dateKey = format(plannedDate, 'yyyy-MM-dd');
        // Check if there's a completion within 24 hours
        const hasCompletion = completedSet.has(dateKey);
        if (!hasCompletion) {
          missed.push(plannedDate);
        }
      }
    });

    return { plannedDates: planned, completedDates: completed, missedDates: missed };
  }, [goal, steps]);

  // Custom day renderer with styling
  const modifiers = {
    planned: plannedDates,
    completed: completedDates,
    missed: missedDates,
  };

  const modifiersClassNames = {
    planned: 'ring-2 ring-blue-400 ring-inset',
    completed: 'bg-green-500 text-white hover:bg-green-600 font-semibold',
    missed: 'bg-red-500 text-white hover:bg-red-600 font-semibold',
  };

  return (
    <div className="space-y-4">
      {/* Streak Information */}
      {(goal.streak_count || (goal as any).longest_streak) && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-3xl font-bold text-primary">
                  {goal.streak_count || 0}
                </div>
                <div className="text-sm text-muted-foreground">Current Streak</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-foreground">
                  {(goal as any).longest_streak || 0}
                </div>
                <div className="text-sm text-muted-foreground">Longest Streak</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md border-2 border-blue-400 flex items-center justify-center">
                <span className="text-xs">15</span>
              </div>
              <span className="text-foreground">Planned</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-green-500 flex items-center justify-center">
                <span className="text-xs text-white font-semibold">15</span>
              </div>
              <span className="text-foreground">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-red-500 flex items-center justify-center">
                <span className="text-xs text-white font-semibold">15</span>
              </div>
              <span className="text-foreground">Missed</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card>
        <CardContent className="pt-6 flex justify-center">
          <Calendar
            mode="single"
            modifiers={modifiers}
            modifiersClassNames={modifiersClassNames}
            className="rounded-md border-0"
            showYearPicker
          />
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {plannedDates.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-500">
                  {plannedDates.length}
                </div>
                <div className="text-xs text-muted-foreground">Planned Days</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-500">
                  {completedDates.length}
                </div>
                <div className="text-xs text-muted-foreground">Completed Days</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-500">
                  {missedDates.length}
                </div>
                <div className="text-xs text-muted-foreground">Missed Days</div>
              </div>
            </div>
            {plannedDates.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border text-center">
                <div className="text-2xl font-bold text-primary">
                  {Math.round((completedDates.length / plannedDates.length) * 100)}%
                </div>
                <div className="text-xs text-muted-foreground">Completion Rate</div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
