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
    completed: 'bg-green-500 text-white hover:bg-green-600 font-bold shadow-sm',
    missed: 'bg-red-500 text-white hover:bg-red-600 font-bold shadow-sm',
  };

  const successRate = plannedDates.length > 0 
    ? Math.round((completedDates.length / plannedDates.length) * 100)
    : 0;

  return (
    <div className="space-y-4">
      {/* Hero Metrics Card */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Goal Title */}
          <h2 className="text-lg font-semibold text-foreground">{goal.title}</h2>
          
          {/* Primary Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Streak - Primary Motivation */}
            <div>
              <div className="text-3xl font-bold text-primary">
                {goal.streak_count && goal.streak_count > 0 
                  ? `🔥 ${goal.streak_count}-Day Streak` 
                  : "Start Your Streak Today!"}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Current Consistency</div>
            </div>
            
            {/* Completed Days - Achievement */}
            <div>
              <div className="text-3xl font-bold text-green-600">
                ✅ {completedDates.length} Days
              </div>
              <div className="text-sm text-muted-foreground mt-1">Completed</div>
            </div>
          </div>

          {/* Secondary Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
            {/* Success Rate - Feedback */}
            <div>
              <div className="text-xl font-medium text-amber-500">
                📊 {successRate}%
              </div>
              <div className="text-xs text-muted-foreground">Success Rate</div>
            </div>
            
            {/* Missed Days - Accountability */}
            <div>
              <div className="text-base font-normal text-red-400">
                ⚠️ {missedDates.length} Missed
              </div>
              <div className="text-xs text-muted-foreground">Days</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar with Compact Legend */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center">
            <Calendar
              mode="single"
              modifiers={modifiers}
              modifiersClassNames={modifiersClassNames}
              className="rounded-md border-0"
              showYearPicker
            />
          </div>
          
          {/* Compact Legend */}
          <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full border-2 border-blue-400" />
              <span>Scheduled</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>Missed</span>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};
