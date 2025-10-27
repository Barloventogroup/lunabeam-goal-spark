import { supabase } from '@/integrations/supabase/client';
import type { Goal, Step, StepStatus, GoalDomain, GoalPriority, GoalStatus } from '@/types';

// Database type conversion helpers
function convertToStep(stepData: any): Step {
  return {
    ...stepData,
    status: stepData.status as StepStatus,
    type: 'action' as const,
    hidden: false,
    blocked: false,
    isBlocking: false,
    precursors: [],
    dependencies: [],
    supportingLinks: [],
    aiGenerated: false,
    userFeedback: {
      tooBig: false,
      confusing: false,
      notRelevant: false,
      needsMoreSteps: false
    },
    metadata: {
      version: 1,
      source: 'rules' as const,
      scoreEase: 3,
      scoreImpact: 3
    }
  };
}

function convertToGoal(goalData: any): Goal {
  return {
    ...goalData,
    domain: (goalData.domain as GoalDomain) || 'other',
    priority: goalData.priority as GoalPriority,
    status: goalData.status as GoalStatus,
    progress: {
      done: 0,
      actionable: 0,
      percent: goalData.progress_pct || 0
    }
  };
}

export interface CheckInPrompt {
  id: string;
  step: Step;
  goal: Goal;
  daysPastDue: number;
  isUrgent: boolean;
}

export interface CheckInResponse {
  stepId: string;
  completed: boolean;
  confidence: number; // 1-5 scale
  blockers?: string;
  needsHelp: boolean;
  reflection?: string;
  minutesSpent?: number;
}

export interface CheckInFeedback {
  encouragement: string;
  suggestions: string[];
  nextSteps: string[];
  adjustments?: {
    extendDueDate?: boolean;
    breakDownStep?: boolean;
    addScaffolding?: boolean;
  };
}

// Check-in orchestration service
export const checkInService = {
  // Get all steps that need check-ins (past due or approaching due date)
  async getPendingCheckIns(): Promise<CheckInPrompt[]> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('User not authenticated');

    // Get all active goals and their steps
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('*')
      .eq('owner_id', user.data.user.id)
      .in('status', ['active', 'planned']);

    if (goalsError) throw goalsError;
    if (!goals?.length) return [];

    const goalIds = goals.map(g => g.id);

    // Get steps that are past due or approaching due date
    const today = new Date().toISOString().split('T')[0];
    const { data: steps, error: stepsError } = await supabase
      .from('steps')
      .select('*')
      .in('goal_id', goalIds)
      .not('status', 'eq', 'done')
      .not('status', 'eq', 'skipped')
      .lte('due_date', today); // Past due

    if (stepsError) throw stepsError;
    if (!steps?.length) return [];

    // Check if we already have recent check-ins for these steps
    const stepIds = steps.map(s => s.id);
    const { data: recentCheckIns, error: checkInsError } = await supabase
      .from('check_ins')
      .select('*')
      .in('goal_id', steps.map(s => s.goal_id))
      .gte('date', new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // Last 2 days

    if (checkInsError) throw checkInsError;

    const recentCheckInGoalIds = new Set(recentCheckIns?.map(ci => ci.goal_id) || []);

    // Create check-in prompts for steps without recent check-ins
    const prompts: CheckInPrompt[] = [];
    
    for (const step of steps) {
      if (recentCheckInGoalIds.has(step.goal_id)) continue;

      const goal = goals.find(g => g.id === step.goal_id);
      if (!goal) continue;

      const daysPastDue = Math.floor(
        (new Date().getTime() - new Date(step.due_date + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24)
      );

      prompts.push({
        id: `checkin_${step.id}`,
        step: convertToStep(step),
        goal: convertToGoal(goal),
        daysPastDue,
        isUrgent: daysPastDue > 3 || step.is_required
      });
    }

    return prompts.sort((a, b) => b.daysPastDue - a.daysPastDue); // Most overdue first
  },

  // Record a check-in response
  async recordCheckIn(response: CheckInResponse): Promise<{ feedback: CheckInFeedback; updatedStep: Step; updatedGoal: Goal }> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('User not authenticated');

    // Get the step and goal
    const { data: stepData, error: stepError } = await supabase
      .from('steps')
      .select('*')
      .eq('id', response.stepId)
      .single();

    if (stepError) throw stepError;

    const { data: goalData, error: goalError } = await supabase
      .from('goals')
      .select('*')
      .eq('id', stepData.goal_id)
      .single();

    if (goalError) throw goalError;

    // Convert database objects to typed interfaces
    const step = convertToStep(stepData);
    const goal = convertToGoal(goalData);

    // Create check-in record
    const { error: checkInError } = await supabase
      .from('check_ins')
      .insert({
        user_id: user.data.user.id,
        goal_id: stepData.goal_id,
        date: new Date().toISOString().split('T')[0],
        reflection: response.reflection || '',
        minutes_spent: response.minutesSpent || 0,
        confidence_1_5: response.confidence,
        evidence_attachments: []
      });

    if (checkInError) throw checkInError;

    // Update step status if completed
    let updatedStep = step;
    if (response.completed && step.status !== 'done') {
      const { data: newStep, error: updateError } = await supabase
        .from('steps')
        .update({ status: 'done', updated_at: new Date().toISOString() })
        .eq('id', response.stepId)
        .select()
        .single();

      if (updateError) throw updateError;
      updatedStep = convertToStep(newStep);
    }

    // Get updated goal with progress
    const { data: updatedGoal, error: goalUpdateError } = await supabase
      .from('goals')
      .select('*')
      .eq('id', step.goal_id)
      .single();

    if (goalUpdateError) throw goalUpdateError;

    // Generate adaptive feedback
    const feedback = this.generateFeedback(response, step, goal);

    // Apply any suggested adjustments
    if (feedback.adjustments) {
      await this.applyAdjustments(response.stepId, step.goal_id, feedback.adjustments);
    }

    return { feedback, updatedStep, updatedGoal: convertToGoal(updatedGoal) };
  },

  // Generate adaptive feedback based on check-in response
  generateFeedback(response: CheckInResponse, step: Step, goal: Goal): CheckInFeedback {
    const feedback: CheckInFeedback = {
      encouragement: '',
      suggestions: [],
      nextSteps: [],
      adjustments: {}
    };

    if (response.completed) {
      // Positive reinforcement for completion
      feedback.encouragement = "Amazing work completing that step! 🎉 You're building real momentum toward your goal.";
      feedback.nextSteps = [
        "Take a moment to celebrate this win",
        "Review what worked well in your approach",
        "Get ready for your next step"
      ];
    } else {
      // Supportive guidance for incomplete steps
      const confidenceLevel = response.confidence;
      
      if (confidenceLevel <= 2) {
        // Low confidence - needs more support
        feedback.encouragement = "It's completely normal to feel stuck sometimes. Let's break this down into smaller pieces you can tackle.";
        feedback.suggestions = [
          "Break this step into 2-3 smaller actions",
          "Set aside just 10 minutes to get started",
          "Ask for help or guidance on the specific challenge"
        ];
        feedback.adjustments.breakDownStep = true;
        feedback.adjustments.addScaffolding = true;
      } else if (confidenceLevel <= 3) {
        // Medium confidence - needs encouragement and minor adjustments
        feedback.encouragement = "You're closer than you think! Sometimes we just need a different approach or more time.";
        feedback.suggestions = [
          "Try a different approach to this step",
          "Set a specific time to focus on this tomorrow",
          "Remove any distractions when you tackle this"
        ];
        feedback.adjustments.extendDueDate = true;
      } else {
        // High confidence but not complete - likely needs time or minor obstacles
        feedback.encouragement = "You've got this! Sounds like you know what to do - you might just need more time or to remove a small obstacle.";
        feedback.suggestions = [
          "Schedule focused time to complete this step",
          "Identify what's preventing completion",
          "Set a realistic new deadline"
        ];
        feedback.adjustments.extendDueDate = true;
      }

      if (response.blockers) {
        feedback.suggestions.unshift("Address the specific blocker you mentioned");
      }

      if (response.needsHelp) {
        feedback.suggestions.push("Get personalized guidance through step chat");
      }
    }

    return feedback;
  },

  // Apply system adjustments based on feedback
  async applyAdjustments(stepId: string, goalId: string, adjustments: CheckInFeedback['adjustments']) {
    if (!adjustments) return;

    if (adjustments.extendDueDate) {
      // Extend due date by 3 days
      const { data: step } = await supabase
        .from('steps')
        .select('due_date')
        .eq('id', stepId)
        .single();

      if (step?.due_date) {
        const newDueDate = new Date(step.due_date);
        newDueDate.setDate(newDueDate.getDate() + 3);
        
        await supabase
          .from('steps')
          .update({ due_date: newDueDate.toISOString().split('T')[0] })
          .eq('id', stepId);
      }
    }

    // Note: breakDownStep and addScaffolding would trigger AI assistance
    // to create additional sub-steps - this would integrate with the step assistance function
  },

  // Get check-in history for analytics and progress tracking
  async getCheckInHistory(goalId?: string, days = 30): Promise<any[]> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('User not authenticated');

    let query = supabase
      .from('check_ins')
      .select('*, goals(title)')
      .eq('user_id', user.data.user.id)
      .gte('date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (goalId) {
      query = query.eq('goal_id', goalId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data || [];
  },

  // Create express check-in for step completion
  async createExpressCheckIn(stepId: string, source: 'express' | 'modal' = 'express'): Promise<{ id: string; points: number }> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('User not authenticated');

    // Get the step and goal
    const { data: step, error: stepError } = await supabase
      .from('steps')
      .select('*, goals(*)')
      .eq('id', stepId)
      .single();

    if (stepError) throw stepError;
    if (!step) throw new Error('Step not found');

    // Create check-in record with source tracking
    const { data: checkIn, error: checkInError } = await supabase
      .from('check_ins')
      .insert({
        user_id: user.data.user.id,
        goal_id: step.goal_id,
        step_id: stepId,
        date: new Date().toISOString().split('T')[0],
        completed: true,
        source: source,
        confidence_1_5: 3, // Default medium confidence
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (checkInError) throw checkInError;

    // Complete the step
    const { error: updateError } = await supabase
      .from('steps')
      .update({ status: 'done', updated_at: new Date().toISOString() })
      .eq('id', stepId);

    if (updateError) throw updateError;

    return { 
      id: checkIn.id, 
      points: step.points_awarded || 5
    };
  },

  // Update check-in difficulty rating
  async updateCheckInDifficulty(checkInId: string, difficulty: 'easy' | 'medium' | 'hard'): Promise<void> {
    const confidenceMap = { easy: 5, medium: 3, hard: 1 };
    
    const { error } = await supabase
      .from('check_ins')
      .update({ 
        confidence_1_5: confidenceMap[difficulty],
        difficulty_rating: difficulty 
      })
      .eq('id', checkInId);

    if (error) throw error;
  }
};