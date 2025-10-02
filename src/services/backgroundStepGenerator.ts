import { supabase } from '@/integrations/supabase/client';
import { stepsGenerator } from './stepsGenerator';
import { stepsService } from './goalsService';
import type { Goal } from '@/types';

export const backgroundStepGenerator = {
  async processGoalsWithoutSteps(userId: string): Promise<void> {
    try {
      const { data: goals, error } = await supabase
        .from('goals')
        .select('*')
        .eq('owner_id', userId)
        .or('planned_steps_count.eq.0,planned_steps_count.is.null')
        .in('status', ['planned', 'active'])
        .order('created_at', { ascending: false })
        .limit(5);

      if (error || !goals || goals.length === 0) {
        return;
      }

      console.log(`[Background] Found ${goals.length} goals without steps`);

      for (const goal of goals as Goal[]) {
        try {
          const generatedSteps = await stepsGenerator.generateSteps(goal);
          
          if (generatedSteps.length > 0) {
            for (const step of generatedSteps) {
              await stepsService.createStep(goal.id, {
                title: step.title,
                notes: step.notes,
                estimated_effort_min: step.estimated_effort_min,
                step_type: step.step_type || 'habit',
                is_planned: true,
                due_date: step.due_date
              });
            }
            console.log(`[Background] Generated ${generatedSteps.length} steps for goal ${goal.id}`);
          }
        } catch (stepError) {
          console.error(`[Background] Failed for goal ${goal.id}:`, stepError);
        }
      }
    } catch (error) {
      console.error('[Background] Step generation failed:', error);
    }
  }
};
