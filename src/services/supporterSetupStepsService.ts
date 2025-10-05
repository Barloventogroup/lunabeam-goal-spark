import { supabase } from "@/integrations/supabase/client";
import type { SupporterSetupStep } from "@/types";

export const supporterSetupStepsService = {
  /**
   * Get all supporter setup steps for a goal by a specific supporter
   */
  async getSupporterSetupSteps(goalId: string, supporterId?: string): Promise<SupporterSetupStep[]> {
    const userId = supporterId || (await supabase.auth.getUser()).data.user?.id;
    
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('supporter_setup_steps')
      .select('*')
      .eq('goal_id', goalId)
      .eq('supporter_id', userId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching supporter setup steps:', error);
      throw error;
    }

    return (data || []) as SupporterSetupStep[];
  },

  /**
   * Create a new supporter setup step
   */
  async createSupporterSetupStep(stepData: {
    goal_id: string;
    supporter_id: string;
    title: string;
    description?: string;
    order_index: number;
    due_date?: string;
    estimated_effort_min?: number;
  }): Promise<SupporterSetupStep> {
    const { data, error } = await supabase
      .from('supporter_setup_steps')
      .insert([stepData])
      .select()
      .single();

    if (error) {
      console.error('Error creating supporter setup step:', error);
      throw error;
    }

    return data as SupporterSetupStep;
  },

  /**
   * Update a supporter setup step
   */
  async updateSupporterSetupStep(
    stepId: string,
    updates: Partial<SupporterSetupStep>
  ): Promise<SupporterSetupStep> {
    const { data, error } = await supabase
      .from('supporter_setup_steps')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', stepId)
      .select()
      .single();

    if (error) {
      console.error('Error updating supporter setup step:', error);
      throw error;
    }

    return data as SupporterSetupStep;
  },

  /**
   * Delete a supporter setup step
   */
  async deleteSupporterSetupStep(stepId: string): Promise<void> {
    const { error } = await supabase
      .from('supporter_setup_steps')
      .delete()
      .eq('id', stepId);

    if (error) {
      console.error('Error deleting supporter setup step:', error);
      throw error;
    }
  },

  /**
   * Toggle supporter setup step status (mark as done/not started)
   */
  async toggleSupporterSetupStepStatus(stepId: string): Promise<SupporterSetupStep> {
    // First get the current step
    const { data: currentStep, error: fetchError } = await supabase
      .from('supporter_setup_steps')
      .select('*')
      .eq('id', stepId)
      .single();

    if (fetchError) {
      console.error('Error fetching supporter setup step:', fetchError);
      throw fetchError;
    }

    const newStatus = currentStep.status === 'done' ? 'not_started' : 'done';
    const completed_at = newStatus === 'done' ? new Date().toISOString() : null;

    return this.updateSupporterSetupStep(stepId, {
      status: newStatus,
      completed_at,
    });
  },

  /**
   * Bulk create supporter setup steps
   */
  async bulkCreateSupporterSetupSteps(
    steps: Array<{
      goal_id: string;
      supporter_id: string;
      title: string;
      description?: string;
      order_index: number;
      due_date?: string;
      estimated_effort_min?: number;
    }>
  ): Promise<SupporterSetupStep[]> {
    const { data, error } = await supabase
      .from('supporter_setup_steps')
      .insert(steps)
      .select();

    if (error) {
      console.error('Error bulk creating supporter setup steps:', error);
      throw error;
    }

    return (data || []) as SupporterSetupStep[];
  },
};
