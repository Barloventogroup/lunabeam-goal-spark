import { supabase } from '@/integrations/supabase/client';
import { goalsService } from './goalsService';
import type { 
  SmartStartPlan, 
  SkillAssessment, 
  TeachingHelper, 
  ProgressionSummary,
  TeachingHelperGoal,
  Goal
} from '@/types';

// Cache for goal types to avoid repeated database queries
const goalTypeCache = new Map<string, string>();

/**
 * Progressive Mastery Service
 * Handles skill assessment, Smart Start frequency suggestions, teaching helper management,
 * check-in logic, and progress tracking for Progressive Mastery goals.
 */
export const progressiveMasteryService = {
  /**
   * Calculate skill level from three assessment questions
   * @param responses - Object containing q1, q2, q3 ratings (1-5 scale)
   * @returns Calculated skill level (1-5, rounded to nearest integer)
   */
  calculateSkillLevel(responses: { q1: number; q2: number; q3: number }): number {
    const average = (responses.q1 + responses.q2 + responses.q3) / 3;
    return Math.round(average);
  },

  /**
   * Get human-readable label for skill level
   * @param level - Numeric skill level (1-5)
   * @returns Human-readable label
   */
  getSkillLevelLabel(level: number): string {
    switch (level) {
      case 1:
        return 'Beginner';
      case 2:
        return 'Early Learner';
      case 3:
        return 'Developing';
      case 4:
        return 'Proficient';
      case 5:
        return 'Independent';
      default:
        return 'Beginner';
    }
  },

  /**
   * Suggest starting frequency based on skill level and target frequency
   * Implements Smart Start algorithm from PRD section 1.3.3
   * @param skillLevel - Calculated skill level (1-5)
   * @param targetFrequency - User's desired target frequency per week
   * @returns Smart Start plan with suggested frequency and guidance
   */
  suggestStartFrequency(skillLevel: number, targetFrequency: number): SmartStartPlan {
    let suggestedInitial: number;
    let rationale: string;
    let phaseGuidance: string;

    switch (skillLevel) {
      case 1: // Beginner
        suggestedInitial = Math.max(1, Math.round(targetFrequency * 0.3));
        rationale = "Since this is brand new to you, we recommend starting with fewer days to build confidence and avoid burnout.";
        phaseGuidance = "We'll increase gradually over 3 phases as you build the skill: Learning → Developing → Proficient.";
        break;

      case 2: // Early Learner
        suggestedInitial = Math.max(2, Math.round(targetFrequency * 0.4));
        rationale = "You've tried this before, so we'll start a bit higher than a complete beginner while still giving you room to grow.";
        phaseGuidance = "We'll ramp up over 2-3 weeks as you develop consistency and confidence.";
        break;

      case 3: // Developing
        suggestedInitial = Math.round(targetFrequency * 0.6);
        rationale = "You have some experience with this, so we can start at a moderate pace and increase as you refine your skills.";
        phaseGuidance = "We'll increase to your target over about 2 weeks as you continue developing.";
        break;

      case 4: // Proficient
        suggestedInitial = Math.max(4, Math.round(targetFrequency * 0.8));
        rationale = "You're already proficient, so we're starting close to your target frequency.";
        phaseGuidance = "We'll reach your full target in 1-2 weeks as you maintain and strengthen your skills.";
        break;

      case 5: // Independent
        suggestedInitial = targetFrequency;
        rationale = "You're already independent with this skill, so we're starting at your target frequency right away.";
        phaseGuidance = "Focus on maintaining consistency and building on your strong foundation.";
        break;

      default:
        suggestedInitial = Math.max(1, Math.round(targetFrequency * 0.5));
        rationale = "We'll start at a moderate pace and adjust based on your progress.";
        phaseGuidance = "We'll increase frequency as you build confidence and skills.";
    }

    return {
      suggested_initial: suggestedInitial,
      target_frequency: targetFrequency,
      rationale,
      phase_guidance: phaseGuidance,
    };
  },

  /**
   * Save skill assessment to goal metadata
   * @param goalId - Goal ID
   * @param responses - Assessment responses (q1, q2, q3)
   */
  async saveSkillAssessment(goalId: string, responses: { q1: number; q2: number; q3: number }): Promise<void> {
    try {
      const calculatedLevel = this.calculateSkillLevel(responses);
      const levelLabel = this.getSkillLevelLabel(calculatedLevel).toLowerCase().replace(' ', '_') as SkillAssessment['level_label'];

      const assessmentData: SkillAssessment = {
        calculated_level: calculatedLevel,
        q1_familiarity: responses.q1,
        q2_confidence: responses.q2,
        q3_independence: responses.q3,
        assessment_date: new Date().toISOString(),
        level_label: levelLabel,
      };

      await goalsService.updateMetadata(goalId, {
        skill_assessment: assessmentData,
      });
    } catch (error) {
      console.error('Failed to save skill assessment:', error);
      throw new Error('Failed to save skill assessment');
    }
  },

  /**
   * Save Smart Start plan to goal metadata and update frequency
   * @param goalId - Goal ID
   * @param plan - Smart Start plan
   * @param accepted - Whether user accepted the suggestion
   * @param selectedFrequency - User's selected starting frequency
   */
  async saveSmartStartPlan(
    goalId: string,
    plan: SmartStartPlan,
    accepted: boolean,
    selectedFrequency: number
  ): Promise<void> {
    try {
      const smartStartData = {
        suggested_initial: plan.suggested_initial,
        user_selected_initial: selectedFrequency,
        target_frequency: plan.target_frequency,
        suggestion_accepted: accepted,
        rationale: plan.rationale,
        phase_guidance: plan.phase_guidance,
        suggested_at: new Date().toISOString(),
      };

      // Update both metadata and frequency_per_week
      await goalsService.updateGoal(goalId, {
        frequency_per_week: selectedFrequency,
        metadata: {
          smart_start: smartStartData,
        },
      });
    } catch (error) {
      console.error('Failed to save Smart Start plan:', error);
      throw new Error('Failed to save Smart Start plan');
    }
  },

  /**
   * Save teaching helper to goal metadata
   * @param goalId - Goal ID
   * @param helperId - Helper's user ID
   * @param name - Helper's name
   * @param relationship - Helper's relationship type
   */
  async saveTeachingHelper(
    goalId: string,
    helperId: string,
    name: string,
    relationship: 'parent' | 'teacher' | 'coach'
  ): Promise<void> {
    try {
      const helperData: TeachingHelper = {
        helper_id: helperId,
        helper_name: name,
        relationship,
      };

      await goalsService.updateMetadata(goalId, {
        teaching_helper: helperData,
      });
    } catch (error) {
      console.error('Failed to save teaching helper:', error);
      throw new Error('Failed to save teaching helper');
    }
  },

  /**
   * Determine if enhanced check-in should be shown for a step
   * Enhanced check-ins are for Progressive Mastery goals, not substeps
   * @param stepId - Step ID
   * @param goalId - Goal ID
   * @returns True if enhanced check-in should be shown
   */
  async shouldShowEnhancedCheckIn(stepId: string, goalId: string): Promise<boolean> {
    try {
      // Check cache first
      if (goalTypeCache.has(goalId)) {
        return goalTypeCache.get(goalId) === 'progressive_mastery';
      }

      // Fetch goal and cache the type
      const goal = await goalsService.getGoal(goalId);
      if (goal?.goal_type) {
        goalTypeCache.set(goalId, goal.goal_type);
        return goal.goal_type === 'progressive_mastery';
      }

      return false;
    } catch (error) {
      console.error('Failed to check if enhanced check-in should be shown:', error);
      return false;
    }
  },

  /**
   * Get progress summary for a Progressive Mastery goal
   * Calls database function and enriches with metadata
   * @param goalId - Goal ID
   * @returns Progress summary with trends and metadata
   */
  async getProgressSummary(goalId: string): Promise<ProgressionSummary> {
    try {
      // Call database function using rpc with proper typing
      const { data, error } = await supabase.rpc('get_progression_summary' as any, {
        goal_uuid: goalId,
      }) as { data: any; error: any };

      if (error) throw error;

      // Enrich with goal metadata
      const goal = await goalsService.getGoal(goalId);

      const summary: ProgressionSummary = {
        total_steps: data?.total_steps || 0,
        completed_steps: data?.completed_steps || 0,
        avg_quality_rating: data?.avg_quality_rating || 0,
        avg_independence_level: data?.avg_independence_level || 0,
        latest_independence_level: data?.latest_independence_level || 0,
        quality_trend: data?.quality_trend || 'insufficient_data',
        independence_trend: data?.independence_trend || 'insufficient_data',
        sessions_with_helper: data?.sessions_with_helper || 0,
        sessions_independent: data?.sessions_independent || 0,
        avg_time_spent_minutes: data?.avg_time_spent_minutes || 0,
        skill_assessment: goal?.metadata?.skill_assessment,
        smart_start: goal?.metadata?.smart_start,
        teaching_helper: goal?.metadata?.teaching_helper,
        current_phase: goal?.metadata?.current_phase,
      };

      return summary;
    } catch (error) {
      console.error('Failed to get progress summary:', error);
      throw new Error('Failed to get progress summary');
    }
  },

  /**
   * Get goals where the user is a teaching helper
   * @param userId - User ID
   * @returns Array of goals where user is teaching helper
   */
  async getGoalsWhereUserIsTeachingHelper(userId: string): Promise<TeachingHelperGoal[]> {
    try {
      const { data, error } = await supabase.rpc('get_teaching_helper_goals' as any, {
        helper_uuid: userId,
      }) as { data: any[]; error: any };

      if (error) throw error;

      return (data || []) as TeachingHelperGoal[];
    } catch (error) {
      console.error('Failed to get teaching helper goals:', error);
      throw new Error('Failed to get teaching helper goals');
    }
  },

  /**
   * Update current learning phase based on recent check-ins
   * Internal helper function called after check-ins
   * Note: This references the new check_ins table structure
   * @param goalId - Goal ID
   */
  async updateCurrentPhase(goalId: string): Promise<void> {
    try {
      // Get recent check-ins (last 5) from the new check_ins table
      const { data: checkIns, error } = await supabase
        .from('check_ins')
        .select('*')
        .eq('goal_id', goalId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      if (!checkIns || checkIns.length === 0) {
        return; // No check-ins yet
      }

      // Calculate average independence from the new table structure
      // The new table uses 'independence_level' column
      const avgIndependence = checkIns.reduce((sum, ci: any) => {
        return sum + (ci.independence_level || 0);
      }, 0) / checkIns.length;

      // Determine phase
      let phase: 'learning' | 'developing' | 'proficient' | 'independent';
      if (avgIndependence >= 4.5) {
        phase = 'independent';
      } else if (avgIndependence >= 3.5) {
        phase = 'proficient';
      } else if (avgIndependence >= 2.0) {
        phase = 'developing';
      } else {
        phase = 'learning';
      }

      // Update goal metadata
      await goalsService.updateMetadata(goalId, {
        current_phase: phase,
      });
    } catch (error) {
      console.error('Failed to update current phase:', error);
      // Don't throw - this is a non-critical operation
    }
  },

  /**
   * Clear goal type cache (useful for testing or after goal updates)
   */
  clearCache(): void {
    goalTypeCache.clear();
  },
};
