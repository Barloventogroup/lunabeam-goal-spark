import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goalsService, stepsService } from '@/services/goalsService';
import { supabase } from '@/integrations/supabase/client';
import type { Goal, Step, Substep } from '@/types';

export const goalDetailKeys = {
  all: ['goalDetail'] as const,
  detail: (goalId: string) => [...goalDetailKeys.all, goalId] as const,
  steps: (goalId: string) => [...goalDetailKeys.all, goalId, 'steps'] as const,
  substeps: (stepIds: string[]) => ['substeps', ...stepIds.sort()] as const,
};

interface GoalDetailData {
  goal: Goal;
  steps: Step[];
  user: any;
  ownerProfile: any;
  creatorProfile: any;
  isViewerSupporter: boolean;
  substeps: Substep[];
}

export function useGoalDetail(goalId: string) {
  return useQuery<GoalDetailData | null>({
    queryKey: goalDetailKeys.detail(goalId),
    queryFn: async () => {
      // Batch all initial queries
      const [{ data: { user } }, goalData, stepsData] = await Promise.all([
        supabase.auth.getUser(),
        goalsService.getGoal(goalId),
        stepsService.getSteps(goalId)
      ]);

      if (!goalData) return null;

      // Batch fetch profiles and supporter relationship
      const [ownerData, creatorData, supporterRelationship] = await Promise.all([
        supabase.from('profiles').select('first_name, user_id').eq('user_id', goalData.owner_id).single(),
        supabase.from('profiles').select('first_name, user_id').eq('user_id', goalData.created_by).single(),
        user 
          ? supabase.from('supporters').select('id, role, permission_level').eq('individual_id', goalData.owner_id).eq('supporter_id', user.id).maybeSingle() 
          : Promise.resolve({ data: null })
      ]);

      // Fetch all scaffolding steps for all steps in a single query
      const stepIds = stepsData?.map(s => s.id) || [];
      let substeps: Substep[] = [];
      
      if (stepIds.length > 0) {
        const { data: scaffoldingStepsData } = await supabase
          .from('steps')
          .select('*')
          .in('parent_step_id', stepIds)
          .eq('is_scaffolding', true)
          .order('created_at', { ascending: true });
        
        // Map scaffolding steps to legacy Substep format
        substeps = (scaffoldingStepsData || []).map(s => ({
          id: s.id,
          step_id: s.parent_step_id!,
          title: s.title,
          description: s.notes,
          is_planned: s.is_planned || false,
          completed_at: s.status === 'done' ? s.updated_at : undefined,
          initiated_at: s.initiated_at,
          points_awarded: s.points_awarded || 0,
          created_at: s.created_at,
          updated_at: s.updated_at,
          due_date: s.due_date
        } as Substep));
      }

      return {
        goal: goalData,
        steps: stepsData || [],
        user,
        ownerProfile: ownerData.data,
        creatorProfile: creatorData.data,
        isViewerSupporter: !!supporterRelationship.data,
        substeps
      };
    },
    staleTime: 3 * 60 * 1000, // Fresh for 3 minutes
    gcTime: 10 * 60 * 1000,   // Keep in cache for 10 minutes
    enabled: !!goalId,
    refetchOnWindowFocus: false, // Disable aggressive refetch
    refetchOnMount: true
  });
}

// Separate mutation for updating goal
export function useUpdateGoalMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ goalId, updates }: { goalId: string; updates: Partial<Goal> }) => {
      return await goalsService.updateGoal(goalId, updates);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: goalDetailKeys.detail(variables.goalId) });
    }
  });
}

// Mutation for deleting goal
export function useDeleteGoalMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (goalId: string) => {
      return await goalsService.deleteGoal(goalId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalDetailKeys.all });
    }
  });
}
