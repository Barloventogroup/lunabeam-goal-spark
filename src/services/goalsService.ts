import { supabase } from '@/integrations/supabase/client';
import type { Goal, Step, GoalDomain, GoalPriority, GoalStatus, StepStatus } from '@/types';

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

  // Create goal
  async createGoal(goalData: {
    title: string;
    description?: string;
    domain?: GoalDomain;
    priority?: GoalPriority;
    start_date?: string;
    due_date?: string;
  }): Promise<Goal> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('goals')
      .insert({
        ...goalData,
        owner_id: user.data.user.id,
      })
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

  // Create step
  async createStep(goalId: string, stepData: {
    title: string;
    is_required?: boolean;
    due_date?: string;
    points?: number;
    notes?: string;
    estimated_effort_min?: number;
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
      })
      .select()
      .single();

    if (stepError) throw stepError;

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