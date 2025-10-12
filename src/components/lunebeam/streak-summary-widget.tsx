import { useEffect, useState } from "react";
import { Flame, Trophy, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { habitTrackingService } from "@/services/habitTrackingService";
import { supabase } from "@/integrations/supabase/client";

export const StreakSummaryWidget = () => {
  const [summary, setSummary] = useState<{
    currentStreak: number;
    longestStreak: number;
    activeHabitsCount: number;
    weekCompletionRate: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const habits = await habitTrackingService.getUserHabits(user.id);
      
      if (habits.length === 0) {
        setIsLoading(false);
        return;
      }

      // Get highest current streak
      const currentStreak = Math.max(...habits.map(h => h.streakData.currentStreak));
      
      // Get longest streak across all habits
      const longestStreak = Math.max(...habits.map(h => h.streakData.longestStreak));
      
      // Count active habits
      const activeHabitsCount = habits.filter(h => 
        h.goal.status === 'active' || h.goal.status === 'planned'
      ).length;

      // Calculate this week's completion rate
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const { data: thisWeekSteps } = await supabase
        .from('steps')
        .select('status')
        .in('goal_id', habits.map(h => h.goal.id))
        .gte('due_date', weekStart.toISOString().split('T')[0]);

      const totalSteps = thisWeekSteps?.length || 0;
      const completedSteps = thisWeekSteps?.filter(s => s.status === 'done').length || 0;
      const weekCompletionRate = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

      setSummary({
        currentStreak,
        longestStreak,
        activeHabitsCount,
        weekCompletionRate
      });
    } catch (error) {
      console.error('Error loading streak summary:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Habit Streaks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (!summary || summary.activeHabitsCount === 0) {
    return null; // Don't show if no active habits
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          Your Habit Streaks
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Flame className="h-4 w-4 text-orange-500 mr-1" />
              <span className="text-2xl font-bold">{summary.currentStreak}</span>
            </div>
            <div className="text-xs text-muted-foreground">Current Streak</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Trophy className="h-4 w-4 text-yellow-500 mr-1" />
              <span className="text-2xl font-bold">{summary.longestStreak}</span>
            </div>
            <div className="text-xs text-muted-foreground">Best Streak</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-2xl font-bold">{summary.weekCompletionRate}%</span>
            </div>
            <div className="text-xs text-muted-foreground">This Week</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
