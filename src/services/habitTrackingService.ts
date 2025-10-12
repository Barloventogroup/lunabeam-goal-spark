import { supabase } from "@/integrations/supabase/client";
import { stepsService } from "./goalsService";
import { pointsService } from "./pointsService";
import type { StreakCalculation, SkipRecord, SkipReason } from "@/types";

/**
 * Habit Tracking Service
 * Handles streak calculation, completion, and skip logic for habit-type goals
 */

export const habitTrackingService = {
  /**
   * Calculate streak for a goal
   * Looks at all completed steps and counts consecutive days
   * Allows 1-day grace period
   */
  async calculateStreak(goalId: string): Promise<StreakCalculation> {
    try {
      // Get the goal and all its completed steps
      const { data: goal, error: goalError } = await supabase
        .from('goals')
        .select('*')
        .eq('id', goalId)
        .single();

      if (goalError) throw goalError;
      if (!goal) throw new Error('Goal not found');

      // Get all steps for this goal ordered by completion date
      const { data: steps, error: stepsError } = await supabase
        .from('steps')
        .select('*')
        .eq('goal_id', goalId)
        .eq('status', 'done')
        .order('initiated_at', { ascending: false });

      if (stepsError) throw stepsError;

      // Calculate streak
      let currentStreak = 0;
      let consecutiveDays = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (steps && steps.length > 0) {
        const completionDates = new Set<string>();
        
        // Collect unique completion dates
        steps.forEach(step => {
          if (step.initiated_at) {
            const date = new Date(step.initiated_at);
            date.setHours(0, 0, 0, 0);
            completionDates.add(date.toISOString().split('T')[0]);
          }
        });

        const sortedDates = Array.from(completionDates)
          .map(d => new Date(d))
          .sort((a, b) => b.getTime() - a.getTime());

        // Count consecutive days from most recent
        let checkDate = new Date(today);
        let gracePeriodUsed = false;

        for (const completionDate of sortedDates) {
          const daysDiff = Math.floor((checkDate.getTime() - completionDate.getTime()) / (1000 * 60 * 60 * 24));

          if (daysDiff === 0) {
            currentStreak++;
            consecutiveDays++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else if (daysDiff === 1) {
            currentStreak++;
            consecutiveDays++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else if (daysDiff === 2 && !gracePeriodUsed) {
            // Allow 1-day grace period once
            gracePeriodUsed = true;
            checkDate.setDate(checkDate.getDate() - 2);
          } else {
            break; // Streak broken
          }
        }
      }

      // Determine if streak is at risk (>24hrs since last completion)
      const lastCompletedDate = goal.last_completed_date 
        ? new Date(goal.last_completed_date) 
        : null;
      
      let isStreakAtRisk = false;
      if (lastCompletedDate && currentStreak > 0) {
        const hoursSinceLastCompletion = (today.getTime() - lastCompletedDate.getTime()) / (1000 * 60 * 60);
        isStreakAtRisk = hoursSinceLastCompletion > 24;
      }

      // Determine milestone
      let streakMilestone: StreakCalculation['streakMilestone'];
      if (currentStreak >= 30) streakMilestone = 'platinum';
      else if (currentStreak >= 14) streakMilestone = 'gold';
      else if (currentStreak >= 7) streakMilestone = 'silver';
      else if (currentStreak >= 3) streakMilestone = 'bronze';

      return {
        currentStreak,
        longestStreak: Math.max(currentStreak, (goal as any).longest_streak || 0),
        lastCompletedDate: lastCompletedDate?.toISOString() || null,
        consecutiveDays,
        isStreakAtRisk,
        streakMilestone,
        goalId
      };
    } catch (error) {
      console.error('Error calculating streak:', error);
      throw error;
    }
  },

  /**
   * Mark a habit step as complete
   * Awards points, updates streak, triggers celebration
   */
  async markHabitComplete(stepId: string, goalId: string): Promise<{
    newStreak: number;
    milestone?: StreakCalculation['streakMilestone'];
    pointsAwarded: number;
  }> {
    try {
      // Complete the step using existing service
      const { step, goal } = await stepsService.completeStep(stepId);

      // Calculate new streak
      const streakData = await this.calculateStreak(goalId);

      // Update goal with new streak data
      const updates: any = {
        streak_count: streakData.currentStreak,
        last_completed_date: new Date().toISOString().split('T')[0],
      };

      // Update longest streak if current is higher
      if (streakData.currentStreak > ((goal as any).longest_streak || 0)) {
        updates.longest_streak = streakData.currentStreak;
      }

      await supabase
        .from('goals')
        .update(updates)
        .eq('id', goalId);

      // Update step's completion streak
      await supabase
        .from('steps')
        .update({ completion_streak: streakData.currentStreak })
        .eq('id', stepId);

      return {
        newStreak: streakData.currentStreak,
        milestone: streakData.streakMilestone,
        pointsAwarded: step.points_awarded || 0
      };
    } catch (error) {
      console.error('Error marking habit complete:', error);
      throw error;
    }
  },

  /**
   * Record a skip with reason
   * Manages streak based on grace period logic
   */
  async recordSkip(
    stepId: string,
    goalId: string,
    reason: SkipReason,
    customNote?: string
  ): Promise<{ streakBroken: boolean; newStreak: number }> {
    try {
      // Get current step and goal
      const { data: step, error: stepError } = await supabase
        .from('steps')
        .select('*')
        .eq('id', stepId)
        .single();

      if (stepError) throw stepError;

      const { data: goal, error: goalError } = await supabase
        .from('goals')
        .select('*')
        .eq('id', goalId)
        .single();

      if (goalError) throw goalError;

      // Calculate current streak status
      const streakData = await this.calculateStreak(goalId);

      // Create skip record
      const skipRecord: SkipRecord = {
        stepId,
        skippedAt: new Date().toISOString(),
        reason,
        customNote,
        streakAtRisk: streakData.isStreakAtRisk
      };

      // Get existing skip reasons array
      const existingSkipReasons = (step.skip_reasons || []) as unknown as SkipRecord[];
      const updatedSkipReasons = [...existingSkipReasons, skipRecord];

      // Update step with skip data
      await supabase
        .from('steps')
        .update({
          skip_count: (step.skip_count || 0) + 1,
          skip_reasons: updatedSkipReasons as any,
          last_skipped_date: new Date().toISOString().split('T')[0],
          status: 'skipped'
        })
        .eq('id', stepId);

      // Determine if streak should break
      // If already at risk and skipping again, break the streak
      let streakBroken = false;
      let newStreak = streakData.currentStreak;

      if (streakData.isStreakAtRisk && streakData.currentStreak > 0) {
        // Break the streak
        streakBroken = true;
        newStreak = 0;

        await supabase
          .from('goals')
          .update({ 
            streak_count: 0,
            last_completed_date: new Date().toISOString().split('T')[0]
          })
          .eq('id', goalId);
      }

      return { streakBroken, newStreak };
    } catch (error) {
      console.error('Error recording skip:', error);
      throw error;
    }
  },

  /**
   * Check if a goal's streak is at risk
   */
  async checkStreakStatus(goalId: string): Promise<{
    isAtRisk: boolean;
    hoursRemaining: number;
  }> {
    try {
      const { data: goal, error } = await supabase
        .from('goals')
        .select('last_completed_date, streak_count')
        .eq('id', goalId)
        .single();

      if (error) throw error;
      if (!goal || !goal.last_completed_date || goal.streak_count === 0) {
        return { isAtRisk: false, hoursRemaining: 0 };
      }

      const lastCompleted = new Date(goal.last_completed_date);
      const now = new Date();
      const hoursSince = (now.getTime() - lastCompleted.getTime()) / (1000 * 60 * 60);
      const isAtRisk = hoursSince > 24;
      const hoursRemaining = Math.max(0, 48 - hoursSince); // 48 hours total before break

      return { isAtRisk, hoursRemaining };
    } catch (error) {
      console.error('Error checking streak status:', error);
      throw error;
    }
  },

  /**
   * Get all habit goals for a user with streak data
   */
  async getUserHabits(userId: string): Promise<Array<{
    goal: any;
    streakData: StreakCalculation;
  }>> {
    try {
      const { data: goals, error } = await supabase
        .from('goals')
        .select('*')
        .eq('owner_id', userId)
        .in('goal_type', ['reminder', 'practice'])
        .in('status', ['active', 'planned']);

      if (error) throw error;
      if (!goals) return [];

      const habitsWithStreaks = await Promise.all(
        goals.map(async (goal) => {
          const streakData = await this.calculateStreak(goal.id);
          return { goal, streakData };
        })
      );

      return habitsWithStreaks;
    } catch (error) {
      console.error('Error getting user habits:', error);
      throw error;
    }
  }
};
