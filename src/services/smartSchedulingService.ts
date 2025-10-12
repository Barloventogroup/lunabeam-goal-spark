import { supabase } from '@/integrations/supabase/client';
import type { Goal, Step } from '@/types';

interface MilestoneGroup {
  id: string;
  steps: Step[];
  dueDate: string;
  title: string;
}

interface SchedulingData {
  frequency: string; // 'daily', 'weekly', 'custom'
  startDate: string;
  duration?: string; // '4 weeks', '30 days'
  customInterval?: number; // days between steps
}

export const smartSchedulingService = {
  // Parse goal timing data from wizard or creation flow
  parseGoalTiming(goal: Goal): SchedulingData | null {
    // Extract from goal description or tags for timing data
    const description = goal.description?.toLowerCase() || '';
    const tags = goal.tags.join(' ').toLowerCase();
    const content = `${description} ${tags}`;
    
    // Look for frequency patterns
    const dailyMatch = content.match(/daily|every day|each day/);
    const weeklyMatch = content.match(/weekly|every week|once a week/);
    const customMatch = content.match(/every (\d+) days?/);
    
    let frequency = 'weekly'; // default
    let customInterval = 7;
    
    if (dailyMatch) {
      frequency = 'daily';
      customInterval = 1;
    } else if (weeklyMatch) {
      frequency = 'weekly';
      customInterval = 7;
    } else if (customMatch) {
      frequency = 'custom';
      customInterval = parseInt(customMatch[1]);
    }
    
    return {
      frequency,
      startDate: goal.start_date || new Date().toISOString().split('T')[0],
      duration: goal.due_date ? this.calculateDuration(goal.start_date!, goal.due_date) : undefined,
      customInterval
    };
  },

  // Calculate duration between dates
  calculateDuration(startDate: string, endDate: string): string {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.ceil(diffDays / 7);
    
    if (diffDays <= 14) return `${diffDays} days`;
    return `${diffWeeks} weeks`;
  },

  // Auto-set due dates for steps based on goal timing
  async autoScheduleSteps(goalId: string): Promise<void> {
    const goal = await this.getGoal(goalId);
    if (!goal) return;
    
    const schedulingData = this.parseGoalTiming(goal);
    if (!schedulingData) return;
    
    const steps = await this.getSteps(goalId);
    if (steps.length === 0) return;
    
    // Sort steps by order_index and handle dependencies
    const sortedSteps = this.resolveDependencyOrder(steps);
    const interval = schedulingData.customInterval || 7;
    const startDate = new Date(schedulingData.startDate);
    
    // Set due dates with interval spacing
    for (let i = 0; i < sortedSteps.length; i++) {
      const step = sortedSteps[i];
      const daysOffset = i * interval;
      const dueDate = new Date(startDate);
      dueDate.setDate(dueDate.getDate() + daysOffset);
      
      await this.updateStepDueDate(step.id, dueDate.toISOString().split('T')[0]);
    }
  },

  // Resolve step order considering dependencies
  resolveDependencyOrder(steps: Step[]): Step[] {
    const sorted: Step[] = [];
    const remaining = [...steps];
    const processed = new Set<string>();
    
    while (remaining.length > 0) {
      const readySteps = remaining.filter(step => 
        step.dependency_step_ids.every(depId => processed.has(depId))
      );
      
      if (readySteps.length === 0) {
        // Handle circular dependencies - just add remaining by order_index
        remaining.sort((a, b) => a.order_index - b.order_index);
        sorted.push(...remaining);
        break;
      }
      
      // Sort ready steps by order_index
      readySteps.sort((a, b) => a.order_index - b.order_index);
      const nextStep = readySteps[0];
      
      sorted.push(nextStep);
      processed.add(nextStep.id);
      remaining.splice(remaining.indexOf(nextStep), 1);
    }
    
    return sorted;
  },

  // Create milestone groups (every 3-4 steps)
  createMilestoneGroups(steps: Step[], stepsPerMilestone = 3): MilestoneGroup[] {
    const sortedSteps = steps.sort((a, b) => a.order_index - b.order_index);
    const groups: MilestoneGroup[] = [];
    
    for (let i = 0; i < sortedSteps.length; i += stepsPerMilestone) {
      const groupSteps = sortedSteps.slice(i, i + stepsPerMilestone);
      const lastStep = groupSteps[groupSteps.length - 1];
      const milestoneNumber = Math.floor(i / stepsPerMilestone) + 1;
      
      groups.push({
        id: `milestone-${milestoneNumber}`,
        steps: groupSteps,
        dueDate: lastStep.due_date || '',
        title: `Milestone ${milestoneNumber}`
      });
    }
    
    return groups;
  },

  // Get steps that need 3-day warning notifications
  async getUpcomingMilestones(): Promise<{ goalId: string; milestone: MilestoneGroup }[]> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) return [];
    
    // Get active goals
    const { data: goals } = await supabase
      .from('goals')
      .select('*')
      .eq('owner_id', user.data.user.id)
      .eq('status', 'active');
    
    if (!goals) return [];
    
    const upcomingMilestones: { goalId: string; milestone: MilestoneGroup }[] = [];
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    for (const goal of goals) {
      const steps = await this.getSteps(goal.id);
      const milestones = this.createMilestoneGroups(steps);
      
      for (const milestone of milestones) {
        const milestoneDate = new Date(milestone.dueDate);
        const today = new Date();
        const diffTime = milestoneDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // 3-day warning window
        if (diffDays === 3) {
          upcomingMilestones.push({ goalId: goal.id, milestone });
        }
      }
    }
    
    return upcomingMilestones;
  },

  // Adjust all future step due dates when frequency changes
  async adjustScheduleFromStep(stepId: string, newInterval: number): Promise<void> {
    const step = await this.getStep(stepId);
    if (!step) return;
    
    const allSteps = await this.getSteps(step.goal_id);
    const sortedSteps = allSteps.sort((a, b) => a.order_index - b.order_index);
    const currentStepIndex = sortedSteps.findIndex(s => s.id === stepId);
    
    if (currentStepIndex === -1) return;
    
    // Adjust all steps after the current one
    const baseDate = new Date(step.due_date || new Date());
    
    for (let i = currentStepIndex + 1; i < sortedSteps.length; i++) {
      const futureStep = sortedSteps[i];
      const stepsAhead = i - currentStepIndex;
      const newDueDate = new Date(baseDate);
      newDueDate.setDate(newDueDate.getDate() + (stepsAhead * newInterval));
      
      await this.updateStepDueDate(futureStep.id, newDueDate.toISOString().split('T')[0]);
    }
  },

  // Helper methods
  async getGoal(goalId: string): Promise<Goal | null> {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('id', goalId)
      .single();
    
    if (error) return null;
    return data as Goal;
  },

  async getSteps(goalId: string): Promise<Step[]> {
    const { data, error } = await supabase
      .from('steps')
      .select('*')
      .eq('goal_id', goalId)
      .order('order_index', { ascending: true });
    
    if (error) return [];
    return (data || []) as Step[];
  },

  async getStep(stepId: string): Promise<Step | null> {
    const { data, error } = await supabase
      .from('steps')
      .select('*')
      .eq('id', stepId)
      .single();
    
    if (error) return null;
    return data as Step;
  },

  async updateStepDueDate(stepId: string, dueDate: string): Promise<void> {
    await supabase
      .from('steps')
      .update({ due_date: dueDate })
      .eq('id', stepId);
  },

  // Schedule next day's habit occurrence
  async scheduleNextHabitOccurrence(goalId: string): Promise<{ scheduledTime: string; success: boolean }> {
    const goal = await this.getGoal(goalId);
    if (!goal) return { scheduledTime: '', success: false };

    // Check if goal is past due date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = goal.due_date ? new Date(goal.due_date) : null;
    
    if (dueDate && today >= dueDate) {
      return { scheduledTime: '', success: false }; // Goal is complete
    }

    // Calculate next occurrence date
    const startDate = goal.start_date ? new Date(goal.start_date) : new Date();
    const nextDate = new Date(today);
    nextDate.setDate(nextDate.getDate() + 1);

    // Check if next date is within goal's due date
    if (dueDate && nextDate > dueDate) {
      return { scheduledTime: '', success: false };
    }

    // Get wizard context for timing
    const metadata = (goal as any).metadata?.wizardContext;
    const startTime = metadata?.customTime || metadata?.timeOfDay || '08:00';
    const [hour, min] = startTime.split(':').map(Number);
    
    nextDate.setHours(hour, min || 0, 0, 0);

    // Generate tomorrow's microsteps (reuse existing wizard context)
    // For simplicity, we'll use the same microstep pattern
    try {
      const { generateMicroStepsSmart } = await import('./microStepsGenerator');
      
      // Fetch current user profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { scheduledTime: '', success: false };

      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name')
        .eq('user_id', goal.owner_id)
        .single();

      const enrichedData = {
        goalTitle: metadata?.goalTitle || goal.title,
        goalMotivation: metadata?.goalMotivation || '',
        customMotivation: metadata?.customMotivation || '',
        goalType: metadata?.goalType || goal.goal_type,
        challengeAreas: metadata?.challengeAreas || [],
        customChallenges: metadata?.customChallenges || '',
        hasPrerequisites: !!metadata?.prerequisite,
        customPrerequisites: metadata?.prerequisite || '',
        startDate: nextDate,
        timeOfDay: metadata?.timeOfDay || 'morning',
        customTime: startTime,
        supportContext: metadata?.supportContext || '',
        primarySupporterName: metadata?.primarySupporterName || '',
        primarySupporterRole: metadata?.primarySupporterRole || '',
        category: goal.domain || 'general',
        supportedPersonName: profile?.first_name || 'them',
        supporterName: metadata?.primarySupporterName || ''
      };

      const microSteps = await generateMicroStepsSmart(enrichedData, 'individual');

      // Save microsteps for tomorrow
      const savedSteps: any[] = [];
      const isHabitGoal = goal.frequency_per_week && goal.frequency_per_week > 0;

      for (let i = 0; i < microSteps.length; i++) {
        const microStep = microSteps[i];
        const isLastStep = i === microSteps.length - 1;
        
        let stepDueDate = new Date(nextDate);
        if (i === 0 && microStep.title.toLowerCase().includes('get ready by')) {
          stepDueDate.setDate(stepDueDate.getDate() - 1);
          stepDueDate.setHours(20, 0, 0, 0);
        } else if (i === 1 || microStep.title.toLowerCase().includes('at ')) {
          stepDueDate = new Date(nextDate);
        } else {
          stepDueDate = new Date(nextDate);
          stepDueDate.setHours(hour + 1, 0, 0, 0);
        }

        const stepType = isLastStep ? (isHabitGoal ? 'habit' : 'milestone') : 'action';

        const { data: step, error } = await supabase
          .from('steps')
          .insert({
            goal_id: goalId,
            title: microStep.title,
            step_type: stepType,
            is_required: true,
            estimated_effort_min: 15,
            is_planned: true,
            notes: microStep.description,
            is_supporter_step: false,
            due_date: stepDueDate.toISOString(),
            status: 'not_started',
            order_index: 1000 + i // High index to append
          })
          .select()
          .single();

        if (!error && step) {
          savedSteps.push(step);
          
          // Set dependency on previous step
          if (i > 0 && savedSteps[i - 1]) {
            await supabase
              .from('steps')
              .update({ dependency_step_ids: [savedSteps[i - 1].id] })
              .eq('id', step.id);
          }
        }
      }

      const scheduledTimeFormatted = nextDate.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit' 
      });

      return { scheduledTime: scheduledTimeFormatted, success: true };
    } catch (error) {
      console.error('Failed to schedule next occurrence:', error);
      return { scheduledTime: '', success: false };
    }
  }
};