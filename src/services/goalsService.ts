import { supabase } from '@/integrations/supabase/client';
import type { Goal, Step, GoalDomain, GoalPriority, GoalStatus, StepStatus, CheckInInput, CheckIn } from '@/types';
import { pointsService } from './pointsService';
import { validateGoalFrequencyWithDueDate } from '@/utils/goalValidationUtils';
import { notificationsService } from './notificationsService';
import { fixGoalDomains } from '@/utils/goalMigrationUtils';

// Make migration available globally for admin use
declare global {
  interface Window {
    fixGoalDomains: () => Promise<void>;
  }
}

if (typeof window !== 'undefined') {
  window.fixGoalDomains = fixGoalDomains;
}

// Helper to normalize step status values to match database constraint
const normalizeStepStatus = (status: string): StepStatus => {
  const statusMap: Record<string, StepStatus> = {
    'todo': 'not_started',
    'doing': 'in_progress',
    'not_started': 'not_started',
    'in_progress': 'in_progress',
    'done': 'done',
    'skipped': 'skipped'
  };
  return (statusMap[status] || 'not_started') as StepStatus;
};

const sanitizeDescription = (text?: string): string => {
  if (!text) return '';
  let out = text.trim();
  
  console.log(`Sanitizing: "${out}"`);
  
  // Fix frequency patterns
  out = out.replace(/(\d+)x\/week/gi, '$1 times per week');
  out = out.replace(/Daily for (\d+)x\/week/gi, '$1 times per week');
  out = out.replace(/Daily for (\d+) times per week/gi, '$1 times per week');
  
  // Fix specific problematic patterns
  out = out.replace(/to finish assignment/gi, 'to finish the assignment');
  out = out.replace(/Templates? \(letter,?\s*essay\)/gi, 'templates for letters and essays');
  out = out.replace(/with Reflection log/gi, 'with a reflection log');
  
  // Fix double parentheses and support sections
  out = out.replace(/\(\s*\(([^)]+)\)\s*\)/g, '($1)');
  out = out.replace(/\.\s*\(with\s+([^)]+)\)\s*$/i, '. With $1');
  out = out.replace(/\s*\(with\s+([^)]+)\)/gi, '. With $1');
  
  // Cleanup spacing and periods
  out = out.replace(/\s{2,}/g, ' ');
  out = out.replace(/\s*\.\s*\./g, '.');
  out = out.replace(/\.\s*With/g, ', with');
  
  if (!/\.$/.test(out)) out += '.';
  
  console.log(`Result: "${out}"`);
  return out;
};

// Goals API
export const goalsService = {
  // Get goals with optional filters
  async getGoals(filters?: {
    status?: GoalStatus;
    dueBefore?: string;
    dueAfter?: string;
    q?: string;
    includeArchived?: boolean;
    owner_id?: string;
    created_by?: string;
  }): Promise<Goal[]> {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user?.id) {
      // Not authenticated or missing user id; avoid invalid UUID errors
      return [];
    }

    // Get supported individuals for this user
    const { data: supportedIndividuals } = await supabase
      .from('supporters')
      .select('individual_id')
      .eq('supporter_id', user.id)
      .eq('is_admin', true);

    const supportedIds = supportedIndividuals?.map(s => s.individual_id) || [];

    let query = supabase
      .from('goals')
      .select('*');

    // Include goals where user is owner, creator, or admin of the owner
    if (supportedIds.length > 0) {
      query = query.or(`owner_id.eq.${user.id},created_by.eq.${user.id},owner_id.in.(${supportedIds.join(',')})`);
    } else {
      query = query.or(`owner_id.eq.${user.id},created_by.eq.${user.id}`);
    }

    // By default, exclude archived goals unless specifically requested
    if (!filters?.includeArchived) {
      query = query.neq('status', 'archived');
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.owner_id) {
      query = query.eq('owner_id', filters.owner_id);
    }
    if (filters?.created_by) {
      query = query.eq('created_by', filters.created_by);
    }
    if (filters?.dueBefore) {
      query = query.lte('due_date', filters.dueBefore);
    }
    if (filters?.dueAfter) {
      query = query.gte('due_date', filters.dueAfter);
    }
    if (filters?.q) {
      query = query.ilike('title', `%${filters.q}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Goal[];
  },

  // Get single goal
  async getGoal(id: string): Promise<Goal | null> {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Goal;
  },

  // Create goal with TPP calculation
  async createGoal(goalData: {
    title: string;
    description?: string;
    domain?: GoalDomain;
    priority?: GoalPriority;
    start_date?: string;
    due_date?: string;
    frequency_per_week?: number;
    duration_weeks?: number;
    step_type?: string;
    planned_milestones_count?: number;
    owner_id?: string;
  }): Promise<Goal> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('User not authenticated');

    const userId = user.data.user.id;
    const ownerId = goalData.owner_id || userId;


    // Parse goal for TPP calculation if not provided
    const parsedGoal = pointsService.parseGoalForTPP(
      goalData.title, 
      goalData.description || ''
    );

    const frequencyPerWeek = goalData.frequency_per_week || parsedGoal.frequencyPerWeek;
    const durationWeeks = goalData.duration_weeks || parsedGoal.durationWeeks;
    const stepType = goalData.step_type || parsedGoal.stepType;
    const plannedMilestonesCount = goalData.planned_milestones_count || parsedGoal.milestonesCount;

    // Calculate duration weeks from dates if not provided
    let calculatedDurationWeeks = durationWeeks;
    if (goalData.start_date && goalData.due_date && !goalData.duration_weeks) {
      const startDate = new Date(goalData.start_date);
      const endDate = new Date(goalData.due_date);
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      calculatedDurationWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
    }

    // Map domain to category for TPP calculation
    const category = pointsService.mapDomainToCategory(goalData.domain || 'general');
    
    // Calculate TPP
    const totalPossiblePoints = await pointsService.calculateTotalPossiblePoints(
      category,
      frequencyPerWeek,
      calculatedDurationWeeks,
      plannedMilestonesCount,
      0, // scaffold count - will be updated when substeps are added
      stepType
    );

    const plannedStepsCount = frequencyPerWeek * calculatedDurationWeeks;
    const basePointsPerStep = pointsService.calculateStepPoints(goalData.domain || 'general', stepType);
    const goalCompletionBonus = pointsService.getGoalCompletionBonus(category);

    const { data, error } = await supabase
      .from('goals')
      .insert({
        ...goalData,
        description: sanitizeDescription(goalData.description),
        owner_id: ownerId,
        created_by: userId,
        priority: goalData.priority || 'medium',
        // Points system fields
        frequency_per_week: frequencyPerWeek,
        duration_weeks: calculatedDurationWeeks,
        planned_steps_count: plannedStepsCount,
        planned_milestones_count: plannedMilestonesCount,
        planned_scaffold_count: 0,
        base_points_per_planned_step: basePointsPerStep,
        base_points_per_milestone: stepType === 'milestone' ? basePointsPerStep : 0,
        substep_points: 2,
        goal_completion_bonus: goalCompletionBonus,
        total_possible_points: totalPossiblePoints,
        earned_points: 0
      })
      .select()
      .single();

    if (error) throw error;
    
    // Send notification email to supporters about goal creation
    try {
      await notificationsService.notifyGoalCreated(user.data.user.id, data.id);
    } catch (notificationError) {
      console.error('Failed to send goal creation notification:', notificationError);
    }
    
    return data as Goal;
  },

  // Update goal TPP when scaffolding changes
  async updateGoalTPP(goalId: string, scaffoldDelta: number = 0): Promise<Goal> {
    const goal = await this.getGoal(goalId);
    if (!goal) throw new Error('Goal not found');

    const newScaffoldCount = (goal.planned_scaffold_count || 0) + scaffoldDelta;
    const category = pointsService.mapDomainToCategory(goal.domain || 'general');
    
    const newTPP = await pointsService.calculateTotalPossiblePoints(
      category,
      goal.frequency_per_week || 1,
      goal.duration_weeks || 4,
      goal.planned_milestones_count || 0,
      newScaffoldCount,
      'habit' // Default step type
    );

    const { data, error } = await supabase
      .from('goals')
      .update({
        planned_scaffold_count: newScaffoldCount,
        total_possible_points: newTPP
      })
      .eq('id', goalId)
      .select()
      .single();

    if (error) throw error;
    return data as Goal;
  },

  // Update goal
  async updateGoal(id: string, updates: Partial<Goal>): Promise<Goal> {
    const { data, error } = await supabase
      .from('goals')
      .update({
        ...updates,
        description: updates.description ? sanitizeDescription(updates.description) : updates.description,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Goal;
  },

  // One-time sanitizer to fix existing descriptions in DB for the current user
  async sanitizeExistingGoalDescriptions(): Promise<void> {
    console.log('Starting sanitization of existing goal descriptions...');
    const user = await supabase.auth.getUser();
    const userId = user.data.user?.id;
    if (!userId) return;

    const { data: goals, error } = await supabase
      .from('goals')
      .select('id, description')
      .eq('owner_id', userId);
    if (error || !goals) {
      console.error('Failed to fetch goals for sanitization:', error);
      return;
    }

    console.log(`Found ${goals.length} goals to check for sanitization`);
    
    for (const g of goals) {
      const original = g.description || '';
      const sanitized = sanitizeDescription(original);
      if (original !== sanitized) {
        console.log(`Updating goal ${g.id}:`);
        console.log(`  FROM: "${original}"`);
        console.log(`  TO: "${sanitized}"`);
        
        const { error: updateError } = await supabase
          .from('goals')
          .update({ description: sanitized })
          .eq('id', g.id);
          
        if (updateError) {
          console.error(`Failed to update goal ${g.id}:`, updateError);
        } else {
          console.log(`Successfully updated goal ${g.id}`);
        }
      }
    }
    console.log('Sanitization complete');
  },
  // Soft delete goal (archive)
  async deleteGoal(id: string): Promise<void> {
    const { error } = await supabase
      .from('goals')
      .update({ status: 'archived' })
      .eq('id', id);

    if (error) throw error;
  },

  // Admin utility to fix goal domains
  async fixGoalDomains(): Promise<void> {
    return fixGoalDomains();
  },

  // Temporary admin utility to reassign goal ownership
  async reassignGoalOwner(goalId: string, newOwnerUserId: string): Promise<Goal> {
    const { data, error } = await supabase
      .from('goals')
      .update({ owner_id: newOwnerUserId })
      .eq('id', goalId)
      .select()
      .single();

    if (error) throw error;
    return data as Goal;
  },

  // Update goal metadata (merge with existing metadata)
  async updateMetadata(goalId: string, metadataUpdates: Record<string, any>): Promise<Goal> {
    const goal = await this.getGoal(goalId);
    if (!goal) throw new Error('Goal not found');
    
    const updatedMetadata = {
      ...goal.metadata,
      ...metadataUpdates
    };
    
    return this.updateGoal(goalId, { metadata: updatedMetadata });
  },

  // Get Progressive Mastery goals for a user
  async getProgressiveMasteryGoals(userId?: string): Promise<Goal[]> {
    const { data: { user } } = await supabase.auth.getUser();
    const targetUserId = userId || user?.id;
    
    if (!targetUserId) return [];
    
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('owner_id', targetUserId)
      .eq('goal_type', 'progressive_mastery')
      .in('status', ['active', 'planned'])
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as Goal[];
  }
};
// Steps API
export const stepsService = {
  // Get steps for a goal
  async getSteps(goalId: string): Promise<Step[]> {
    const { data, error } = await supabase
      .from('steps')
      .select('*')
      .eq('goal_id', goalId)
      .order('order_index', { ascending: true });

    if (error) throw error;
    return (data || []) as Step[];
  },
  async createStep(goalId: string, stepData: {
    title: string;
    is_required?: boolean;
    due_date?: string;
    points?: number;
    notes?: string;
    estimated_effort_min?: number;
    step_type?: string;
    is_planned?: boolean;
    planned_week_index?: number;
    is_supporter_step?: boolean;
  }): Promise<{ step: Step; goal: Goal }> {
    // Validate due date against goal's due date (treat goal due date as end-of-day)
    if (stepData.due_date) {
      const goal = await goalsService.getGoal(goalId);
      if (goal?.due_date) {
        const stepDueDate = new Date(stepData.due_date);
        const goalDueEnd = new Date(goal.due_date);
        goalDueEnd.setHours(23, 59, 59, 999);
        if (stepDueDate > goalDueEnd) {
          throw new Error(`Step due date cannot be after goal due date (${goalDueEnd.toLocaleDateString()}).`);
        }
      }
    }

    // Get the next order index
    const { count } = await supabase
      .from('steps')
      .select('*', { count: 'exact' })
      .eq('goal_id', goalId);

    const { data: newStep, error: stepError } = await supabase
      .from('steps')
      .insert({
        ...stepData,
        goal_id: goalId,
        order_index: count || 0,
        type: 'action', // ensure actionable by default
        step_type: stepData.step_type || 'habit',
        is_planned: stepData.is_planned !== undefined ? stepData.is_planned : true,
      })
      .select()
      .single();

    if (stepError) throw stepError;

    // Auto-schedule steps if this is the first step added
    if (count === 0) {
      // Import here to avoid circular dependency
      const { smartSchedulingService } = await import('./smartSchedulingService');
      setTimeout(() => {
        smartSchedulingService.autoScheduleSteps(goalId).catch(console.error);
      }, 100);
    }

    // Get updated goal with progress
    const { data: goalData, error: goalError } = await supabase
      .from('goals')
      .select('*')
      .eq('id', goalId)
      .single();

    if (goalError) throw goalError;

    // Update goal status to active if it was planned
    if (goalData.status === 'planned') {
      const { data: updatedGoal, error: updateError } = await supabase
        .from('goals')
        .update({ status: 'active' })
        .eq('id', goalId)
        .select()
        .single();

      if (updateError) throw updateError;
      return { step: newStep as Step, goal: updatedGoal as Goal };
    }

    return { step: newStep as Step, goal: goalData as Goal };
  },

  // Update step
  async updateStep(stepId: string, updates: Partial<Step>): Promise<{ step: Step; goal: Goal }> {
    // Validate due date against goal's due date if updating due_date
    if (updates.due_date) {
      const { data: stepData, error: stepError } = await supabase
        .from('steps')
        .select('goal_id')
        .eq('id', stepId)
        .single();
      
      if (stepError) throw stepError;
      
      const goal = await goalsService.getGoal(stepData.goal_id);
      if (goal?.due_date) {
        const stepDueDate = new Date(updates.due_date);
        const goalDueEnd = new Date(goal.due_date);
        goalDueEnd.setHours(23, 59, 59, 999);
        if (stepDueDate > goalDueEnd) {
          throw new Error(`Step due date cannot be after goal due date (${goalDueEnd.toLocaleDateString()}).`);
        }
      }
    }
    const { data: updatedStep, error: stepError } = await supabase
      .from('steps')
      .update(updates)
      .eq('id', stepId)
      .select()
      .single();

    if (stepError) throw stepError;

    // Get updated goal
    const { data: goalData, error: goalError } = await supabase
      .from('goals')
      .select('*')
      .eq('id', updatedStep.goal_id)
      .single();

    if (goalError) throw goalError;

    return { step: updatedStep as Step, goal: goalData as Goal };
  },

  // Complete step
  async completeStep(stepId: string, pointsOverride?: number): Promise<{ step: Step; goal: Goal }> {
    const updates: Partial<Step> = { 
      status: 'done',
      updated_at: new Date().toISOString()
    };

    if (pointsOverride !== undefined) {
      updates.points = pointsOverride;
    }

    return this.updateStep(stepId, updates);
  },

  // Skip step
  async skipStep(stepId: string): Promise<{ step: Step; goal: Goal }> {
    return this.updateStep(stepId, { 
      status: 'skipped',
      updated_at: new Date().toISOString()
    });
  },

  // Reorder steps
  async reorderSteps(goalId: string, orderedStepIds: string[]): Promise<Goal> {
    // Update order_index for each step atomically
    const updates = orderedStepIds.map((stepId, index) => ({
      id: stepId,
      order_index: index
    }));

    for (const update of updates) {
      const { error } = await supabase
        .from('steps')
        .update({ order_index: update.order_index })
        .eq('id', update.id)
        .eq('goal_id', goalId); // Ensure step belongs to goal

      if (error) throw error;
    }

    // Get updated goal
    const { data: goalData, error: goalError } = await supabase
      .from('goals')
      .select('*')
      .eq('id', goalId)
      .single();

    if (goalError) throw goalError;
    return goalData as Goal;
  },

  // Delete step
  async deleteStep(stepId: string): Promise<Goal> {
    // Get step to know which goal to return
    const { data: stepData, error: getError } = await supabase
      .from('steps')
      .select('goal_id')
      .eq('id', stepId)
      .single();

    if (getError) throw getError;

    const { error } = await supabase
      .from('steps')
      .delete()
      .eq('id', stepId);

    if (error) throw error;

    // Get updated goal
    const { data: goalData, error: goalError } = await supabase
      .from('goals')
      .select('*')
      .eq('id', stepData.goal_id)
      .single();

    if (goalError) throw goalError;
    return goalData as Goal;
  },

  // Check in to step (mark initiation)
  async checkInStep(stepId: string): Promise<void> {
    const { error } = await supabase
      .from('steps')
      .update({ initiated_at: new Date().toISOString() })
      .eq('id', stepId);

    if (error) throw error;
  },

  /**
   * Complete a step with rich check-in data (Progressive Mastery)
   * Orchestrates step completion AND check-in creation
   */
  async completeWithCheckIn(stepId: string, checkInData: CheckInInput): Promise<{ step: Step; goal: Goal; checkIn: CheckIn }> {
    try {
      // Import to avoid circular dependency
      const { checkInsService } = await import('./checkInsService');
      
      // Create check-in first (validates data)
      const checkIn = await checkInsService.create(checkInData);
      
      // Increment attempt count
      await this.incrementAttemptCount(stepId);
      
      // Complete the step
      const { step, goal } = await this.completeStep(stepId);
      
      return { step, goal, checkIn };
    } catch (err) {
      console.error('Error in completeWithCheckIn:', err);
      throw err;
    }
  },

  /**
   * Increment attempt count for a step
   * Note: This is a placeholder for future attempt tracking functionality
   */
  async incrementAttemptCount(stepId: string): Promise<void> {
    try {
      // Update last_attempted_at timestamp
      const { error } = await supabase
        .from('steps')
        .update({ 
          updated_at: new Date().toISOString()
        })
        .eq('id', stepId);
      
      if (error) {
        console.error('Failed to update step attempt timestamp:', error);
      }
    } catch (err) {
      console.error('Error updating step attempt:', err);
    }
  },

  // Scaffolding Steps Functions (replaces substeps)
  
  // Get scaffolding steps (children of a parent step)
  async getScaffoldingSteps(parentStepId: string): Promise<Step[]> {
    const { data, error } = await supabase
      .from('steps')
      .select('*')
      .eq('parent_step_id', parentStepId)
      .eq('is_scaffolding', true)
      .order('order_index');
    
    if (error) throw error;
    return (data || []) as Step[];
  },

  // Create scaffolding step (result of "Break it down")
  async createScaffoldingStep(
    goalId: string,
    parentStepId: string,
    stepData: Partial<Step>
  ): Promise<Step> {
    // Get parent step to determine scaffolding level
    const { data: parentStep } = await supabase
      .from('steps')
      .select('scaffolding_level, order_index')
      .eq('id', parentStepId)
      .single();
    
    const scaffoldingLevel = (parentStep?.scaffolding_level || 0) + 1;
    
    // Get count of existing scaffolding steps for this parent
    const { count } = await supabase
      .from('steps')
      .select('*', { count: 'exact', head: true })
      .eq('parent_step_id', parentStepId);
    
    // Calculate order_index (insert after parent + existing scaffolding steps)
    const orderIndex = (parentStep?.order_index || 0) + (count || 0) + 1;
    
    const { data, error } = await supabase
      .from('steps')
      .insert([{
        title: stepData.title || 'New Step',
        notes: stepData.notes,
        explainer: stepData.explainer,
        goal_id: goalId,
        parent_step_id: parentStepId,
        is_scaffolding: true,
        scaffolding_level: scaffoldingLevel,
        order_index: orderIndex,
        status: 'not_started',
        type: 'action',
        is_required: true,
        points: 2,
        dependency_step_ids: stepData.dependency_step_ids || []
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    // Reorder subsequent steps
    await this.reorderStepsAfterInsert(goalId, orderIndex);
    
    return data as Step;
  },

  // Helper to reorder steps after inserting scaffolding
  async reorderStepsAfterInsert(goalId: string, insertedAtIndex: number): Promise<void> {
    const { data: stepsToShift } = await supabase
      .from('steps')
      .select('id, order_index')
      .eq('goal_id', goalId)
      .gt('order_index', insertedAtIndex)
      .order('order_index');
    
    if (stepsToShift && stepsToShift.length > 0) {
      const updates = stepsToShift.map((step, idx) => ({
        id: step.id,
        order_index: insertedAtIndex + idx + 1
      }));
      
      for (const update of updates) {
        await supabase
          .from('steps')
          .update({ order_index: update.order_index })
          .eq('id', update.id);
      }
    }
  }
};