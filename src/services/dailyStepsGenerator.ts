import { supabase } from "@/integrations/supabase/client";
import { stepsService } from "./goalsService";
import { generateMicroStepsSmart } from "./microStepsGenerator";
import { format } from "date-fns";

export const dailyStepsGenerator = {
  /**
   * Generate steps for the next scheduled occurrence of habit goals
   * Called daily via cron or on-demand when user opens app
   */
  async generateNextDaySteps(goalId: string): Promise<{
    success: boolean;
    daysGenerated: number;
    error?: string;
  }> {
    try {
      // Get goal with metadata
      const { data: goal, error: goalError } = await supabase
        .from('goals')
        .select('*')
        .eq('id', goalId)
        .single();

      if (goalError || !goal) {
        throw new Error('Goal not found');
      }

      // Only process habit goals
      if (!goal.frequency_per_week || goal.frequency_per_week === 0) {
        return { success: true, daysGenerated: 0 };
      }

      const metadata = goal.metadata as any;
      const plannedOccurrences = metadata?.plannedOccurrences || [];
      const lastGeneratedIndex = metadata?.lastGeneratedOccurrenceIndex ?? -1;
      const wizardContext = metadata?.wizardContext;

      if (!plannedOccurrences.length || !wizardContext) {
        console.log(`No planned occurrences or wizard context for goal ${goalId}`);
        return { success: true, daysGenerated: 0 };
      }

      // Check which occurrences need generation (look ahead 2 days)
      const now = new Date();
      const lookAheadDays = 2;
      const lookAheadDate = new Date(now);
      lookAheadDate.setDate(lookAheadDate.getDate() + lookAheadDays);

      let daysGenerated = 0;
      let nextIndex = lastGeneratedIndex + 1;

      // Fetch owner profile for context
      const { data: ownerProfile } = await supabase
        .from('profiles')
        .select('first_name')
        .eq('user_id', goal.owner_id)
        .single();

      // Generate steps for occurrences within look-ahead window
      while (nextIndex < plannedOccurrences.length) {
        const occurrenceDate = new Date(plannedOccurrences[nextIndex]);
        
        // Stop if this occurrence is beyond look-ahead window
        if (occurrenceDate > lookAheadDate) {
          break;
        }

        // Check if steps already exist for this date
        const { data: existingSteps } = await supabase
          .from('steps')
          .select('id')
          .eq('goal_id', goalId)
          .gte('due_date', format(occurrenceDate, 'yyyy-MM-dd'))
          .lte('due_date', format(occurrenceDate, 'yyyy-MM-dd'))
          .limit(1);

        if (existingSteps && existingSteps.length > 0) {
          console.log(`Steps already exist for occurrence ${nextIndex + 1}, skipping`);
          nextIndex++;
          continue;
        }

        console.log(`Generating steps for occurrence ${nextIndex + 1}/${plannedOccurrences.length} on ${format(occurrenceDate, 'MMM d, yyyy')}`);

        // Build enriched data (same as in goal-detail-v2.tsx)
        const enrichedData = {
          goalTitle: wizardContext.goalTitle,
          goalMotivation: wizardContext.goalMotivation,
          customMotivation: wizardContext.customMotivation,
          goalType: wizardContext.goalType,
          challengeAreas: wizardContext.challengeAreas,
          customChallenges: wizardContext.customChallenges,
          hasPrerequisites: !!wizardContext.prerequisite,
          customPrerequisites: wizardContext.prerequisite || '',
          startDate: occurrenceDate,
          timeOfDay: wizardContext.timeOfDay,
          customTime: wizardContext.customTime,
          supportContext: wizardContext.supportContext,
          primarySupporterName: wizardContext.primarySupporterName,
          primarySupporterRole: wizardContext.primarySupporterRole,
          category: goal.domain || 'general',
          supportedPersonName: ownerProfile?.first_name || 'them',
          supporterName: wizardContext.primarySupporterName
        };

        // Generate individual steps
        const individualSteps = await generateMicroStepsSmart(enrichedData, 'individual');

        if (!individualSteps || individualSteps.length === 0) {
          throw new Error('No steps generated');
        }

        // Save steps (same logic as in goal-detail-v2.tsx)
        const startTime = wizardContext.customTime || wizardContext.timeOfDay || '08:00';
        const [startHour, startMin] = startTime.split(':').map(Number);
        const savedIndividualSteps: any[] = [];
        const isHabitGoal = true;

        for (let i = 0; i < individualSteps.length; i++) {
          const microStep = individualSteps[i];
          const isLastStep = i === individualSteps.length - 1;
          
          let stepType = 'action';
          if (isLastStep) {
            stepType = 'habit'; // Last step is always habit type for habit goals
          }

          // Calculate due date
          let stepDueDate: Date = new Date(occurrenceDate);
          if (i === 0 && microStep.title.toLowerCase().includes('get ready by')) {
            stepDueDate.setDate(stepDueDate.getDate() - 1);
            stepDueDate.setHours(20, 0, 0, 0);
          } else if (i === 1 || microStep.title.toLowerCase().includes('at ')) {
            stepDueDate = new Date(occurrenceDate);
          } else {
            stepDueDate = new Date(occurrenceDate);
            stepDueDate.setHours(startHour + 1, 0, 0, 0);
          }

          const { step } = await stepsService.createStep(goal.id, {
            title: microStep.title,
            step_type: stepType,
            is_required: true,
            estimated_effort_min: 15,
            is_planned: true,
            notes: microStep.description,
            is_supporter_step: false,
            due_date: stepDueDate.toISOString()
          });

          savedIndividualSteps.push(step);

          // Set dependency on previous step
          if (i > 0 && savedIndividualSteps[i - 1]) {
            await supabase
              .from('steps')
              .update({ dependency_step_ids: [savedIndividualSteps[i - 1].id] })
              .eq('id', step.id);
          }
        }

        // Generate supporter steps if needed
        if (wizardContext.primarySupporterRole === 'hands_on_helper') {
          const [startHourStr, startMinStr] = startTime.split(':');
          const startHourNum = parseInt(startHourStr);
          const startMinNum = parseInt(startMinStr || '0');
          
          let prepHour: number;
          let prepMin: number = 0;
          
          if (startHourNum <= 10) {
            prepHour = Math.min(8, startHourNum - 2);
            prepMin = 0;
          } else {
            prepHour = startHourNum - 2;
            prepMin = startMinNum;
          }
          
          const prepPeriod = prepHour >= 12 ? 'PM' : 'AM';
          const prepDisplayHour = prepHour % 12 || 12;
          const prepTimeFormatted = `${prepDisplayHour}:${prepMin.toString().padStart(2, '0')} ${prepPeriod}`;
          
          const supporterEnrichedData = {
            ...enrichedData,
            startDate: occurrenceDate,
            supporterTimingOffset: `by ${prepTimeFormatted}`,
            individualStartTime: startTime,
            individualStartDay: format(occurrenceDate, 'EEEE')
          };
          
          const supporterSteps = await generateMicroStepsSmart(supporterEnrichedData, 'supporter');
          
          for (let i = 0; i < supporterSteps.length; i++) {
            const coachStep = supporterSteps[i];
            
            let stepDueDate: Date;
            if (i === 0 && coachStep.title.toLowerCase().includes('prep')) {
              stepDueDate = new Date(occurrenceDate);
              stepDueDate.setHours(prepHour, prepMin, 0, 0);
            } else if (i === 1 || coachStep.title.toLowerCase().includes('at ')) {
              stepDueDate = new Date(occurrenceDate);
            } else {
              stepDueDate = new Date(occurrenceDate);
              stepDueDate.setMinutes(startMinNum + 30);
            }
            
            const timingHint = i === 0 
              ? `\n\nℹ️ Recommended timing: Before individual starts at ${startTime}`
              : `\n\nℹ️ Recommended timing: Around ${stepDueDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
            
            await stepsService.createStep(goal.id, {
              title: coachStep.title,
              step_type: 'action',
              is_required: false,
              estimated_effort_min: 10,
              is_planned: true,
              notes: coachStep.description + timingHint,
              is_supporter_step: true,
              due_date: stepDueDate.toISOString()
            });
          }
        }

        daysGenerated++;
        nextIndex++;

        // Update metadata with new lastGeneratedOccurrenceIndex
        await supabase
          .from('goals')
          .update({
            metadata: {
              ...metadata,
              lastGeneratedOccurrenceIndex: nextIndex - 1
            } as any
          })
          .eq('id', goalId);

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      console.log(`Generated ${daysGenerated} days for goal ${goalId}`);
      return { success: true, daysGenerated };

    } catch (error: any) {
      console.error('Error generating next day steps:', error);
      return { 
        success: false, 
        daysGenerated: 0, 
        error: error.message 
      };
    }
  },

  /**
   * Check all active habit goals and generate upcoming steps
   */
  async generateUpcomingStepsForAllGoals(userId: string): Promise<{
    totalGoalsChecked: number;
    totalDaysGenerated: number;
    errors: string[];
  }> {
    try {
      // Get all active habit goals for user
      const { data: goals, error } = await supabase
        .from('goals')
        .select('id, title, frequency_per_week')
        .eq('owner_id', userId)
        .eq('status', 'active')
        .gt('frequency_per_week', 0);

      if (error) throw error;
      if (!goals || goals.length === 0) {
        return { totalGoalsChecked: 0, totalDaysGenerated: 0, errors: [] };
      }

      let totalDaysGenerated = 0;
      const errors: string[] = [];

      for (const goal of goals) {
        const result = await this.generateNextDaySteps(goal.id);
        
        if (result.success) {
          totalDaysGenerated += result.daysGenerated;
        } else {
          errors.push(`${goal.title}: ${result.error}`);
        }
      }

      return {
        totalGoalsChecked: goals.length,
        totalDaysGenerated,
        errors
      };
    } catch (error: any) {
      console.error('Error in generateUpcomingStepsForAllGoals:', error);
      throw error;
    }
  }
};
