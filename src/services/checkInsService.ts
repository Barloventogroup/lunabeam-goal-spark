import { supabase } from '@/integrations/supabase/client';
import type { 
  CheckInInput, 
  CheckIn, 
  ProgressionAnalytics, 
  StepProgressionData 
} from '@/types';

/**
 * Check-Ins Service
 * Handles rich check-in data collection for Progressive Mastery goals
 */
class CheckInsService {
  
  // ============= CRUD Methods =============
  
  /**
   * Create a new check-in
   * Validates all required fields before insertion
   */
  async create(data: CheckInInput): Promise<CheckIn> {
    try {
      this.validateCheckInData(data);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const result = await (supabase
        .from('check_ins') as any)
        .insert({
          user_id: user.id,
          goal_id: data.goalId,
          step_id: data.stepId,
          quality_rating: data.qualityRating,
          independence_level: data.independenceLevel,
          time_spent_minutes: data.timeSpentMinutes,
          confidence_before: data.confidenceBefore,
          confidence_after: data.confidenceAfter,
          notes: data.notes,
          helper_present: data.helperPresent || false,
          helper_id: data.helperId
        })
        .select()
        .single();
      
      const { data: checkIn, error } = result;
      
      if (error) {
        console.error('Failed to create check-in:', error);
        throw new Error(`Failed to create check-in: ${error.message}`);
      }
      
      // Update learning phase after check-in
      const { progressiveMasteryService } = await import('./progressiveMasteryService');
      await progressiveMasteryService.updateCurrentPhase(data.goalId).catch(err => {
        console.error('Failed to update learning phase:', err);
      });
      
      return this.mapToCheckIn(checkIn);
    } catch (err) {
      console.error('Error in checkInsService.create:', err);
      throw err;
    }
  }
  
  /**
   * Get all check-ins for a goal
   */
  async getByGoal(goalId: string, limit: number = 50): Promise<CheckIn[]> {
    try {
      const result = await (supabase
        .from('check_ins') as any)
        .select('id, user_id, goal_id, step_id, quality_rating, independence_level, time_spent_minutes, confidence_before, confidence_after, notes, helper_present, helper_id, created_at, updated_at')
        .eq('goal_id', goalId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      const { data, error } = result;
      
      if (error) {
        console.error('Failed to fetch check-ins for goal:', error);
        throw new Error(`Failed to fetch check-ins: ${error.message}`);
      }
      
      return (data || []).map((ci: any) => this.mapToCheckIn(ci));
    } catch (err) {
      console.error('Error in checkInsService.getByGoal:', err);
      throw err;
    }
  }
  
  /**
   * Get all check-ins for a step
   */
  async getByStep(stepId: string): Promise<CheckIn[]> {
    try {
      const result = await (supabase
        .from('check_ins') as any)
        .select('id, user_id, goal_id, step_id, quality_rating, independence_level, time_spent_minutes, confidence_before, confidence_after, notes, helper_present, helper_id, created_at, updated_at')
        .eq('step_id', stepId)
        .order('created_at', { ascending: false });
      
      const { data, error } = result;
      
      if (error) {
        console.error('Failed to fetch check-ins for step:', error);
        throw new Error(`Failed to fetch check-ins: ${error.message}`);
      }
      
      return (data || []).map((ci: any) => this.mapToCheckIn(ci));
    } catch (err) {
      console.error('Error in checkInsService.getByStep:', err);
      throw err;
    }
  }
  
  /**
   * Get the most recent check-in for a step
   */
  async getLatestForStep(stepId: string): Promise<CheckIn | null> {
    try {
      const result = await (supabase
        .from('check_ins') as any)
        .select('id, user_id, goal_id, step_id, quality_rating, independence_level, time_spent_minutes, confidence_before, confidence_after, notes, helper_present, helper_id, created_at, updated_at')
        .eq('step_id', stepId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      const { data, error } = result;
      
      if (error) {
        console.error('Failed to fetch latest check-in:', error);
        throw new Error(`Failed to fetch latest check-in: ${error.message}`);
      }
      
      return data ? this.mapToCheckIn(data) : null;
    } catch (err) {
      console.error('Error in checkInsService.getLatestForStep:', err);
      throw err;
    }
  }
  
  /**
   * Update an existing check-in (within 24 hours)
   */
  async update(checkInId: string, updates: Partial<CheckInInput>): Promise<CheckIn> {
    try {
      // Validate updates
      if (Object.keys(updates).length > 0) {
        const partialData: any = {};
        if (updates.qualityRating !== undefined) partialData.qualityRating = updates.qualityRating;
        if (updates.independenceLevel !== undefined) partialData.independenceLevel = updates.independenceLevel;
        if (updates.timeSpentMinutes !== undefined) partialData.timeSpentMinutes = updates.timeSpentMinutes;
        if (updates.notes !== undefined) partialData.notes = updates.notes;
        this.validateCheckInData(partialData, true);
      }
      
      const updateData: any = {};
      if (updates.qualityRating !== undefined) updateData.quality_rating = updates.qualityRating;
      if (updates.independenceLevel !== undefined) updateData.independence_level = updates.independenceLevel;
      if (updates.timeSpentMinutes !== undefined) updateData.time_spent_minutes = updates.timeSpentMinutes;
      if (updates.confidenceBefore !== undefined) updateData.confidence_before = updates.confidenceBefore;
      if (updates.confidenceAfter !== undefined) updateData.confidence_after = updates.confidenceAfter;
      if (updates.notes !== undefined) updateData.notes = updates.notes;
      if (updates.helperPresent !== undefined) updateData.helper_present = updates.helperPresent;
      if (updates.helperId !== undefined) updateData.helper_id = updates.helperId;
      
      const { data, error } = await supabase
        .from('check_ins')
        .update(updateData)
        .eq('id', checkInId)
        .select()
        .single();
      
      if (error) {
        console.error('Failed to update check-in:', error);
        throw new Error(`Failed to update check-in: ${error.message}`);
      }
      
      return this.mapToCheckIn(data);
    } catch (err) {
      console.error('Error in checkInsService.update:', err);
      throw err;
    }
  }
  
  /**
   * Delete a check-in
   */
  async delete(checkInId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('check_ins')
        .delete()
        .eq('id', checkInId);
      
      if (error) {
        console.error('Failed to delete check-in:', error);
        throw new Error(`Failed to delete check-in: ${error.message}`);
      }
    } catch (err) {
      console.error('Error in checkInsService.delete:', err);
      throw err;
    }
  }
  
  // ============= Analytics Methods =============
  
  /**
   * Get progression analytics for a goal
   * Aggregates check-in data to provide insights
   */
  async getProgressionAnalytics(goalId: string): Promise<ProgressionAnalytics> {
    try {
      const checkIns = await this.getByGoal(goalId, 100); // Get more for better analytics
      
      if (checkIns.length === 0) {
        return {
          totalCheckIns: 0,
          avgQualityRating: 0,
          avgIndependenceLevel: 0,
          qualityTrend: 'insufficient_data',
          independenceTrend: 'insufficient_data',
          avgTimeSpentMinutes: 0,
          sessionsWithHelper: 0,
          sessionsIndependent: 0,
          confidenceGain: 0,
          recentCheckIns: []
        };
      }
      
      const qualityRatings = checkIns.map(ci => ci.qualityRating);
      const independenceLevels = checkIns.map(ci => ci.independenceLevel);
      const timeSpent = checkIns.filter(ci => ci.timeSpentMinutes).map(ci => ci.timeSpentMinutes!);
      
      const sessionsWithHelper = checkIns.filter(ci => ci.helperPresent).length;
      const sessionsIndependent = checkIns.filter(ci => !ci.helperPresent).length;
      
      // Calculate confidence gain (only where both before and after are present)
      const confidenceChanges = checkIns
        .filter(ci => ci.confidenceBefore && ci.confidenceAfter)
        .map(ci => ci.confidenceAfter! - ci.confidenceBefore!);
      
      return {
        totalCheckIns: checkIns.length,
        avgQualityRating: this.average(qualityRatings),
        avgIndependenceLevel: this.average(independenceLevels),
        qualityTrend: this.calculateTrend(qualityRatings.reverse()), // Reverse to chronological order
        independenceTrend: this.calculateTrend(independenceLevels.reverse()),
        avgTimeSpentMinutes: this.average(timeSpent),
        sessionsWithHelper,
        sessionsIndependent,
        confidenceGain: this.average(confidenceChanges),
        recentCheckIns: checkIns.slice(0, 5)
      };
    } catch (err) {
      console.error('Error in checkInsService.getProgressionAnalytics:', err);
      throw err;
    }
  }
  
  /**
   * Get progression data for a specific step
   */
  async getStepProgressionData(stepId: string): Promise<StepProgressionData> {
    try {
      const checkIns = await this.getByStep(stepId);
      
      if (checkIns.length === 0) {
        // Get step title
        const { data: step } = await supabase
          .from('steps')
          .select('title')
          .eq('id', stepId)
          .single();
        
        return {
          stepId,
          stepTitle: step?.title || 'Unknown Step',
          attemptCount: 0,
          checkIns: [],
          improvementRate: 0,
          avgQuality: 0,
          avgIndependence: 0
        };
      }
      
      const independenceLevels = checkIns.map(ci => ci.independenceLevel).reverse(); // Chronological
      const improvementRate = independenceLevels.length > 1
        ? ((independenceLevels[independenceLevels.length - 1] - independenceLevels[0]) / independenceLevels[0]) * 100
        : 0;
      
      return {
        stepId,
        stepTitle: checkIns[0].stepTitle || 'Unknown Step',
        attemptCount: checkIns.length,
        checkIns: checkIns.reverse(), // Return in chronological order
        improvementRate,
        avgQuality: this.average(checkIns.map(ci => ci.qualityRating)),
        avgIndependence: this.average(checkIns.map(ci => ci.independenceLevel))
      };
    } catch (err) {
      console.error('Error in checkInsService.getStepProgressionData:', err);
      throw err;
    }
  }
  
  /**
   * Get recent check-in activity for a user
   */
  async getRecentActivity(userId: string, days: number = 7): Promise<CheckIn[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const result = await (supabase
        .from('check_ins') as any)
        .select('id, user_id, goal_id, step_id, quality_rating, independence_level, time_spent_minutes, confidence_before, confidence_after, notes, helper_present, helper_id, created_at, updated_at')
        .eq('user_id', userId)
        .gte('created_at', cutoffDate.toISOString())
        .order('created_at', { ascending: false });
      
      const { data, error } = result;
      
      if (error) {
        console.error('Failed to fetch recent activity:', error);
        throw new Error(`Failed to fetch recent activity: ${error.message}`);
      }
      
      return (data || []).map((ci: any) => this.mapToCheckIn(ci));
    } catch (err) {
      console.error('Error in checkInsService.getRecentActivity:', err);
      throw err;
    }
  }
  
  // ============= Helper/Utility Functions =============
  
  /**
   * Calculate arithmetic mean of numbers
   */
  private average(numbers: number[]): number {
    const valid = numbers.filter(n => n != null && !isNaN(n));
    if (valid.length === 0) return 0;
    return Math.round((valid.reduce((sum, n) => sum + n, 0) / valid.length) * 10) / 10;
  }
  
  /**
   * Sum an array of numbers
   */
  private sum(numbers: number[]): number {
    return numbers.filter(n => n != null && !isNaN(n)).reduce((sum, n) => sum + n, 0);
  }
  
  /**
   * Calculate trend from chronological values
   * Requires at least 6 values for meaningful trend
   */
  private calculateTrend(values: number[]): 'improving' | 'stable' | 'declining' | 'insufficient_data' {
    if (values.length < 6) return 'insufficient_data';
    
    const midPoint = Math.floor(values.length / 2);
    const firstHalf = values.slice(0, midPoint);
    const secondHalf = values.slice(midPoint);
    
    const firstAvg = this.average(firstHalf);
    const secondAvg = this.average(secondHalf);
    const difference = secondAvg - firstAvg;
    
    if (difference >= 0.5) return 'improving';
    if (difference <= -0.5) return 'declining';
    return 'stable';
  }
  
  /**
   * Validate check-in data
   * Throws descriptive errors for validation failures
   */
  private validateCheckInData(data: Partial<CheckInInput>, isUpdate: boolean = false): void {
    // Required fields for create
    if (!isUpdate) {
      if (!data.goalId || !data.stepId) {
        throw new Error('Goal ID and Step ID are required');
      }
      if (data.qualityRating === undefined || data.independenceLevel === undefined) {
        throw new Error('Quality rating and independence level are required');
      }
    }
    
    // Validate numeric ranges
    if (data.qualityRating !== undefined) {
      if (!Number.isInteger(data.qualityRating) || data.qualityRating < 1 || data.qualityRating > 5) {
        throw new Error('Quality rating must be between 1 and 5');
      }
    }
    
    if (data.independenceLevel !== undefined) {
      if (!Number.isInteger(data.independenceLevel) || data.independenceLevel < 1 || data.independenceLevel > 5) {
        throw new Error('Independence level must be between 1 and 5');
      }
    }
    
    if (data.timeSpentMinutes !== undefined && data.timeSpentMinutes !== null) {
      if (data.timeSpentMinutes < 1) {
        throw new Error('Time spent must be positive');
      }
      if (!Number.isInteger(data.timeSpentMinutes) || data.timeSpentMinutes > 480) {
        throw new Error('Time spent cannot exceed 480 minutes');
      }
    }
    
    if (data.confidenceBefore !== undefined && data.confidenceBefore !== null) {
      if (!Number.isInteger(data.confidenceBefore) || data.confidenceBefore < 1 || data.confidenceBefore > 5) {
        throw new Error('confidenceBefore must be an integer between 1 and 5');
      }
    }
    
    if (data.confidenceAfter !== undefined && data.confidenceAfter !== null) {
      if (!Number.isInteger(data.confidenceAfter) || data.confidenceAfter < 1 || data.confidenceAfter > 5) {
        throw new Error('confidenceAfter must be an integer between 1 and 5');
      }
    }
    
    // Validate string length
    if (data.notes !== undefined && data.notes !== null) {
      if (data.notes.length > 500) {
        throw new Error('Notes cannot exceed 500 characters');
      }
    }
    
    // Logical consistency
    if (data.helperPresent && !data.helperId) {
      throw new Error('Helper ID required when helper is present');
    }
  }
  
  /**
   * Map database record to CheckIn type
   */
  private mapToCheckIn(dbRecord: any): CheckIn {
    return {
      id: dbRecord.id,
      userId: dbRecord.user_id,
      goalId: dbRecord.goal_id,
      stepId: dbRecord.step_id,
      qualityRating: dbRecord.quality_rating,
      independenceLevel: dbRecord.independence_level,
      timeSpentMinutes: dbRecord.time_spent_minutes,
      confidenceBefore: dbRecord.confidence_before,
      confidenceAfter: dbRecord.confidence_after,
      notes: dbRecord.notes,
      helperPresent: dbRecord.helper_present,
      helperId: dbRecord.helper_id,
      createdAt: dbRecord.created_at,
      updatedAt: dbRecord.updated_at
    };
  }
}

// Export singleton instance
export const checkInsService = new CheckInsService();
