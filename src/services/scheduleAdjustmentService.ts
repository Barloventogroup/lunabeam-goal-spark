import { supabase } from '@/integrations/supabase/client';
import { smartSchedulingService } from './smartSchedulingService';
import type { CheckInPrompt } from './checkInService';

interface ScheduleAdjustmentRequest {
  type: 'need_more_time' | 'change_frequency' | 'reschedule_milestone';
  stepId?: string;
  goalId: string;
  userMessage: string;
  currentDueDate?: string;
  requestedExtension?: number; // days
  newFrequency?: string;
}

interface AdjustmentResponse {
  success: boolean;
  message: string;
  newDueDate?: string;
  affectedSteps?: number;
}

export const scheduleAdjustmentService = {
  // Handle "I need more time" requests from check-ins
  async handleExtensionRequest(
    prompt: CheckInPrompt, 
    userReason?: string
  ): Promise<AdjustmentResponse> {
    const step = prompt.step;
    const goal = prompt.goal;
    
    // Default extension based on step complexity
    const defaultExtension = this.calculateDefaultExtension(step.estimated_effort_min || 30);
    
    // Generate AI response with schedule adjustment
    const aiResponse = await this.getAIScheduleAdjustment({
      type: 'need_more_time',
      stepId: step.id,
      goalId: goal.id,
      userMessage: userReason || `I need more time to complete: ${step.title}`,
      currentDueDate: step.due_date,
      requestedExtension: defaultExtension
    });
    
    if (aiResponse.success) {
      // Apply the extension
      await this.extendStepDeadline(step.id, defaultExtension);
      
      return {
        success: true,
        message: aiResponse.message,
        newDueDate: aiResponse.newDueDate,
        affectedSteps: aiResponse.affectedSteps
      };
    }
    
    return {
      success: false,
      message: "Unable to adjust schedule at this time. Please try again later."
    };
  },

  // Calculate smart extension based on step effort
  calculateDefaultExtension(effortMinutes: number): number {
    if (effortMinutes <= 30) return 2; // 2 days for quick tasks
    if (effortMinutes <= 120) return 3; // 3 days for medium tasks  
    return 5; // 5 days for complex tasks
  },

  // Extend step deadline and cascade to dependent steps
  async extendStepDeadline(stepId: string, extensionDays: number): Promise<void> {
    const step = await smartSchedulingService.getStep(stepId);
    if (!step || !step.due_date) return;
    
    const currentDueDate = new Date(step.due_date);
    const newDueDate = new Date(currentDueDate);
    newDueDate.setDate(newDueDate.getDate() + extensionDays);
    
    // Update this step
    await smartSchedulingService.updateStepDueDate(stepId, newDueDate.toISOString().split('T')[0]);
    
    // Find and update dependent steps
    const allSteps = await smartSchedulingService.getSteps(step.goal_id);
    const dependentSteps = allSteps.filter(s => 
      s.dependency_step_ids.includes(stepId) || s.order_index > step.order_index
    );
    
    for (const depStep of dependentSteps) {
      if (depStep.due_date) {
        const depCurrentDate = new Date(depStep.due_date);
        const depNewDate = new Date(depCurrentDate);
        depNewDate.setDate(depNewDate.getDate() + extensionDays);
        
        await smartSchedulingService.updateStepDueDate(
          depStep.id, 
          depNewDate.toISOString().split('T')[0]
        );
      }
    }
  },

  // Get AI-powered schedule adjustment advice
  async getAIScheduleAdjustment(request: ScheduleAdjustmentRequest): Promise<AdjustmentResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('schedule-adjustment', {
        body: request
      });
      
      if (error) throw error;
      
      return data as AdjustmentResponse;
    } catch (error) {
      console.error('AI schedule adjustment failed:', error);
      return {
        success: false,
        message: "I understand you need more time. I've given you a few extra days to complete this step."
      };
    }
  },

  // Handle frequency change requests (affects all future steps)
  async handleFrequencyChange(
    goalId: string, 
    currentStepId: string, 
    newFrequency: string
  ): Promise<AdjustmentResponse> {
    const frequencyMap: Record<string, number> = {
      'daily': 1,
      'every other day': 2,
      'weekly': 7,
      'bi-weekly': 14
    };
    
    const newInterval = frequencyMap[newFrequency.toLowerCase()] || 7;
    
    try {
      await smartSchedulingService.adjustScheduleFromStep(currentStepId, newInterval);
      
      return {
        success: true,
        message: `Great! I've adjusted your schedule to ${newFrequency}. All future steps have been rescheduled accordingly.`,
        affectedSteps: await this.countFutureSteps(goalId, currentStepId)
      };
    } catch (error) {
      return {
        success: false,
        message: "Unable to adjust your schedule right now. Please try again later."
      };
    }
  },

  // Count steps that will be affected by schedule changes
  async countFutureSteps(goalId: string, currentStepId: string): Promise<number> {
    const allSteps = await smartSchedulingService.getSteps(goalId);
    const currentStep = allSteps.find(s => s.id === currentStepId);
    
    if (!currentStep) return 0;
    
    return allSteps.filter(s => s.order_index > currentStep.order_index).length;
  }
};