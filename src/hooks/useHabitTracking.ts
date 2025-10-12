import { useState, useEffect } from "react";
import { habitTrackingService } from "@/services/habitTrackingService";
import { toast } from "@/hooks/use-toast";
import type { StreakCalculation, SkipReason } from "@/types";

export const useHabitTracking = (goalId: string) => {
  const [streakData, setStreakData] = useState<StreakCalculation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const loadStreakData = async () => {
    if (!goalId) return;
    
    setIsLoading(true);
    try {
      const data = await habitTrackingService.calculateStreak(goalId);
      setStreakData(data);
    } catch (error) {
      console.error('Error loading streak data:', error);
      toast({
        title: "Error",
        description: "Failed to load streak data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const markComplete = async (stepId: string): Promise<{ pointsAwarded: number; newStreak: number }> => {
    try {
      const result = await habitTrackingService.markHabitComplete(stepId, goalId);
      
      // Reload streak data
      await loadStreakData();
      
      toast({
        title: "Completed! 🎉",
        description: `${result.newStreak}-day streak! +${result.pointsAwarded} points`
      });
      
      return { pointsAwarded: result.pointsAwarded, newStreak: result.newStreak };
    } catch (error) {
      console.error('Error marking complete:', error);
      toast({
        title: "Error",
        description: "Failed to mark step as complete",
        variant: "destructive"
      });
      throw error;
    }
  };
  
  const skipStep = async (stepId: string, reason: SkipReason, customNote?: string): Promise<void> => {
    try {
      const result = await habitTrackingService.recordSkip(stepId, goalId, reason, customNote);
      
      // Reload streak data
      await loadStreakData();
      
      if (result.streakBroken) {
        toast({
          title: "Streak Reset",
          description: "Your streak was reset. Start fresh tomorrow! 💪",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Step Skipped",
          description: "You still have your streak! Try again tomorrow."
        });
      }
    } catch (error) {
      console.error('Error skipping step:', error);
      toast({
        title: "Error",
        description: "Failed to record skip",
        variant: "destructive"
      });
      throw error;
    }
  };
  
  useEffect(() => {
    loadStreakData();
  }, [goalId]);
  
  return { 
    streakData, 
    markComplete, 
    skipStep, 
    loadStreakData, 
    isLoading 
  };
};
