import { supabase } from '@/integrations/supabase/client';
import type { Goal, Step, GoalDomain, GoalPriority, GoalStatus, StepStatus } from '@/types';
import { pointsService } from './pointsService';

// Goals API
export const goalsService = {
  // Get goals with optional filters
  async getGoals(filters?: {
    status?: GoalStatus;
    dueBefore?: string;
    dueAfter?: string;
    q?: string;
    includeArchived?: boolean;
  }): Promise<Goal[]> {
    let query = supabase
      .from('goals')
      .select('*')
      .eq('owner_id', (await supabase.auth.getUser()).data.user?.id);

    // By default, exclude archived goals unless specifically requested
    if (!filters?.includeArchived) {
      query = query.neq('status', 'archived');
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
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
  }): Promise<Goal> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('User not authenticated');

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
        owner_id: user.data.user.id,
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
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Goal;
  },

  // Soft delete goal (archive)
  async deleteGoal(id: string): Promise<void> {
    const { error } = await supabase
      .from('goals')
      .update({ status: 'archived' })
      .eq('id', id);

    if (error) throw error;
  },
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

  // Create step (with auto-scheduling and step_type support)
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
  }): Promise<{ step: Step; goal: Goal }> {
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
};