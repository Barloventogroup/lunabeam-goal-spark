import React, { useMemo, useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Goal, Step } from '@/types';
import { format, parseISO, startOfDay, isAfter, isBefore, isSameDay, addDays, addMonths, subMonths, startOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
interface GoalCalendarViewProps {
  goal: Goal;
  steps: Step[];
}
export const GoalCalendarView: React.FC<GoalCalendarViewProps> = ({
  goal,
  steps
}) => {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));

  // Calculate dates for calendar display
  const {
    plannedDates,
    completedDates,
    missedDates
  } = useMemo(() => {
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
    steps.filter(step => step.status === 'done' && step.updated_at).forEach(step => {
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
    return {
      plannedDates: planned,
      completedDates: completed,
      missedDates: missed
    };
  }, [goal, steps]);

  // Determine if previous month should be shown (only if goal existed then)
  const showPreviousMonth = useMemo(() => {
    if (!goal.start_date) return true;
    const goalStart = startOfMonth(parseISO(goal.start_date));
    const prevMonth = startOfMonth(subMonths(currentMonth, 1));
    return !isBefore(prevMonth, goalStart);
  }, [goal.start_date, currentMonth]);

  // Custom day renderer with styling
  const modifiers = {
    planned: plannedDates,
    completed: completedDates,
    missed: missedDates
  };
  const modifiersClassNames = {
    planned: 'ring-2 ring-blue-400 ring-inset',
    completed: 'bg-green-500 text-white hover:bg-green-600 font-bold shadow-sm',
    missed: 'bg-red-500 text-white hover:bg-red-600 font-bold shadow-sm'
  };
  return <div className="space-y-4">
      {/* Hero Metrics Card - Horizontal Layout */}
      <Card>
        <CardContent className="pt-6 pb-6">
          <div className="flex items-center justify-around divide-x divide-border">
            {/* Streak */}
            <div className="flex-1 text-center">
              <div className="text-muted-foreground text-sm mb-2">Streak</div>
              <div className="text-2xl font-bold text-primary">
                🔥 {goal.streak_count && goal.streak_count > 0 ? goal.streak_count : 0}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  {goal.streak_count === 1 ? 'day' : 'days'}
                </span>
              </div>
            </div>
            
            {/* Completed */}
            <div className="flex-1 text-center">
              <div className="text-muted-foreground text-sm mb-2">Completed</div>
              <div className="text-2xl font-bold text-green-600">
                {completedDates.length}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  {completedDates.length === 1 ? 'day' : 'days'}
                </span>
              </div>
            </div>
            
            {/* Missed */}
            <div className="flex-1 text-center">
              <div className="text-muted-foreground text-sm mb-2">Missed</div>
              <div className="text-2xl font-bold text-red-500">
                {missedDates.length}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  {missedDates.length === 1 ? 'day' : 'days'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Multi-Month Calendar with Navigation */}
      <Card>
        <CardContent className="pt-6 px-0">
          {/* Navigation Controls */}
          <div className="px-6">
            <div className="flex items-center justify-center gap-4 mb-4">
              <Button variant="outline" size="icon" onClick={() => setCurrentMonth(prev => startOfMonth(subMonths(prev, 1)))} aria-label="Previous month">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <span className="font-semibold text-base min-w-[200px] text-center text-foreground">
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              
              <Button variant="outline" size="icon" onClick={() => setCurrentMonth(prev => startOfMonth(addMonths(prev, 1)))} aria-label="Next month">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Single Month Calendar */}
          <div className="flex justify-center">
            <Calendar
              mode="single"
              month={currentMonth}
              modifiers={modifiers}
              modifiersClassNames={modifiersClassNames}
              className="rounded-md border-0"
              disableNavigation={true}
              showOutsideDays={false}
            />
          </div>
          
          {/* Compact Legend */}
          <div className="px-6">
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
          </div>
        </CardContent>
      </Card>

    </div>;
};