import { supabase } from "@/integrations/supabase/client";
import type { SkipPatterns, HabitAnalytics, SkipRecord } from "@/types";

/**
 * Habit Analysis Service
 * Analyzes skip patterns and generates LLM-powered recommendations
 */

export const habitAnalysisService = {
  /**
   * Analyze skip patterns for a goal
   */
  async analyzeSkipPatterns(goalId: string): Promise<SkipPatterns> {
    try {
      // Get all steps with skip records
      const { data: steps, error } = await supabase
        .from('steps')
        .select('skip_reasons, initiated_at')
        .eq('goal_id', goalId);

      if (error) throw error;
      if (!steps) return this.emptyPatterns();

      // Flatten all skip records
      const allSkips: SkipRecord[] = [];
      steps.forEach(step => {
        if (step.skip_reasons && Array.isArray(step.skip_reasons)) {
          const skipRecords = step.skip_reasons as unknown as SkipRecord[];
          allSkips.push(...skipRecords);
        }
      });

      if (allSkips.length === 0) return this.emptyPatterns();

      // Analyze time of day patterns
      const timeOfDayMap = new Map<number, number>();
      allSkips.forEach(skip => {
        const hour = new Date(skip.skippedAt).getHours();
        timeOfDayMap.set(hour, (timeOfDayMap.get(hour) || 0) + 1);
      });

      const timeOfDay = Array.from(timeOfDayMap.entries())
        .map(([hour, count]) => ({ hour, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Analyze day of week patterns
      const dayOfWeekMap = new Map<string, number>();
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      allSkips.forEach(skip => {
        const day = dayNames[new Date(skip.skippedAt).getDay()];
        dayOfWeekMap.set(day, (dayOfWeekMap.get(day) || 0) + 1);
      });

      const dayOfWeek = Array.from(dayOfWeekMap.entries())
        .map(([day, count]) => ({ day, count }))
        .sort((a, b) => b.count - a.count);

      // Analyze reason patterns
      const reasonMap = new Map<string, number>();
      allSkips.forEach(skip => {
        reasonMap.set(skip.reason, (reasonMap.get(skip.reason) || 0) + 1);
      });

      const reasons = Array.from(reasonMap.entries())
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count);

      // Count consecutive skips
      const sortedSkips = [...allSkips].sort((a, b) => 
        new Date(a.skippedAt).getTime() - new Date(b.skippedAt).getTime()
      );

      let maxConsecutive = 0;
      let currentConsecutive = 1;

      for (let i = 1; i < sortedSkips.length; i++) {
        const prevDate = new Date(sortedSkips[i - 1].skippedAt);
        const currDate = new Date(sortedSkips[i].skippedAt);
        const daysDiff = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDiff <= 1) {
          currentConsecutive++;
        } else {
          maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
          currentConsecutive = 1;
        }
      }
      maxConsecutive = Math.max(maxConsecutive, currentConsecutive);

      return {
        timeOfDay,
        dayOfWeek,
        reasons,
        consecutiveSkips: maxConsecutive
      };
    } catch (error) {
      console.error('Error analyzing skip patterns:', error);
      return this.emptyPatterns();
    }
  },

  /**
   * Generate schedule recommendations based on patterns
   */
  async generateScheduleRecommendations(
    goalId: string,
    patterns: SkipPatterns
  ): Promise<string[]> {
    try {
      const recommendations: string[] = [];

      // Recommendation: Most common skip reason
      if (patterns.reasons.length > 0) {
        const topReason = patterns.reasons[0];
        
        if (topReason.reason === 'busy' && topReason.count >= 3) {
          recommendations.push(
            "You've skipped 'Too Busy' multiple times. Consider reducing frequency to 3x per week or choosing a less busy time of day."
          );
        }
        
        if (topReason.reason === 'tired' && topReason.count >= 3) {
          recommendations.push(
            "You're often too tired. Try scheduling earlier in the day when energy is higher."
          );
        }

        if (topReason.reason === 'forgot' && topReason.count >= 2) {
          recommendations.push(
            "Enable notifications to remind you at your committed time."
          );
        }
      }

      // Recommendation: Time of day pattern
      if (patterns.timeOfDay.length > 0 && patterns.timeOfDay[0].count >= 3) {
        const problematicHour = patterns.timeOfDay[0].hour;
        const period = problematicHour < 12 ? 'morning' : problematicHour < 17 ? 'afternoon' : 'evening';
        recommendations.push(
          `You often skip during ${period} (around ${problematicHour}:00). Consider trying a different time.`
        );
      }

      // Recommendation: Day of week pattern
      if (patterns.dayOfWeek.length > 0 && patterns.dayOfWeek[0].count >= 2) {
        const problematicDay = patterns.dayOfWeek[0].day;
        recommendations.push(
          `${problematicDay}s seem challenging. Consider focusing on other days or preparing in advance.`
        );
      }

      // Recommendation: Consecutive skips
      if (patterns.consecutiveSkips >= 3) {
        recommendations.push(
          "You've had consecutive skips. This habit might be too ambitious right now. Consider starting with a smaller, easier version."
        );
      }

      return recommendations;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [];
    }
  },

  /**
   * Get weekly habit report
   */
  async getWeeklyHabitReport(
    goalId: string,
    weekStartDate: Date
  ): Promise<{
    completions: number;
    skips: number;
    completionRate: number;
    streakMaintained: boolean;
  }> {
    try {
      const weekEnd = new Date(weekStartDate);
      weekEnd.setDate(weekEnd.getDate() + 7);

      // Get all steps for this goal in the week
      const { data: steps, error } = await supabase
        .from('steps')
        .select('*')
        .eq('goal_id', goalId)
        .gte('due_date', weekStartDate.toISOString().split('T')[0])
        .lt('due_date', weekEnd.toISOString().split('T')[0]);

      if (error) throw error;
      if (!steps) {
        return {
          completions: 0,
          skips: 0,
          completionRate: 0,
          streakMaintained: false
        };
      }

      const completions = steps.filter(s => s.status === 'done').length;
      const skips = steps.filter(s => s.status === 'skipped').length;
      const total = steps.length;
      const completionRate = total > 0 ? (completions / total) * 100 : 0;

      // Check if streak was maintained (at least 1 completion per day if daily habit)
      const { data: goal } = await supabase
        .from('goals')
        .select('frequency_per_week')
        .eq('id', goalId)
        .single();

      const expectedPerWeek = goal?.frequency_per_week || 7;
      const streakMaintained = completions >= expectedPerWeek;

      return {
        completions,
        skips,
        completionRate,
        streakMaintained
      };
    } catch (error) {
      console.error('Error generating weekly report:', error);
      return {
        completions: 0,
        skips: 0,
        completionRate: 0,
        streakMaintained: false
      };
    }
  },

  /**
   * Get comprehensive analytics for a habit goal
   */
  async getHabitAnalytics(goalId: string): Promise<HabitAnalytics> {
    try {
      const { data: goal, error: goalError } = await supabase
        .from('goals')
        .select('*')
        .eq('id', goalId)
        .single();

      if (goalError) throw goalError;

      // Get all completed steps
      const { data: completedSteps, error: stepsError } = await supabase
        .from('steps')
        .select('*')
        .eq('goal_id', goalId)
        .eq('status', 'done');

      if (stepsError) throw stepsError;

      const totalCompletions = completedSteps?.length || 0;

      // Get all steps to calculate completion rate
      const { data: allSteps } = await supabase
        .from('steps')
        .select('id, status')
        .eq('goal_id', goalId);

      const totalSteps = allSteps?.length || 0;
      const completionRate = totalSteps > 0 ? (totalCompletions / totalSteps) * 100 : 0;

      // Get skip patterns
      const skipPatterns = await this.analyzeSkipPatterns(goalId);

      // Calculate average skips per week
      const weeksSinceStart = goal.created_at 
        ? Math.max(1, Math.floor((Date.now() - new Date(goal.created_at).getTime()) / (7 * 24 * 60 * 60 * 1000)))
        : 1;

      const totalSkips = allSteps?.filter(s => s.status === 'skipped').length || 0;
      const averageSkipsPerWeek = totalSkips / weeksSinceStart;

      return {
        goalId,
        totalCompletions,
        currentStreak: goal.streak_count || 0,
        longestStreak: goal.longest_streak || 0,
        completionRate,
        averageSkipsPerWeek,
        mostCommonSkipReason: skipPatterns.reasons[0]?.reason || null,
        skipPatterns
      };
    } catch (error) {
      console.error('Error getting habit analytics:', error);
      throw error;
    }
  },

  emptyPatterns(): SkipPatterns {
    return {
      timeOfDay: [],
      dayOfWeek: [],
      reasons: [],
      consecutiveSkips: 0
    };
  }
};
