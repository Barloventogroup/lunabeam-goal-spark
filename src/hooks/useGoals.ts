import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goalsService } from '@/services/goalsService';
import { supabase } from '@/integrations/supabase/client';
import type { Goal, GoalStatus } from '@/types';

// Query keys for consistent caching
export const goalsKeys = {
  all: ['goals'] as const,
  lists: () => [...goalsKeys.all, 'list'] as const,
  list: (filters?: { status?: GoalStatus; owner_id?: string; created_by?: string }) => 
    [...goalsKeys.lists(), filters] as const,
  details: () => [...goalsKeys.all, 'detail'] as const,
  detail: (id: string) => [...goalsKeys.details(), id] as const,
};

// Fetch goals with caching
export function useGoals(filters?: { status?: GoalStatus; owner_id?: string; created_by?: string }) {
  return useQuery({
    queryKey: goalsKeys.list(filters),
    queryFn: async () => {
      const goals = await goalsService.getGoals(filters);
      
      // Batch fetch profiles for all goals
      const userIds = new Set<string>();
      goals.forEach(goal => {
        if (goal.owner_id) userIds.add(goal.owner_id);
        if (goal.created_by) userIds.add(goal.created_by);
      });

      let profiles: Record<string, any> = {};
      if (userIds.size > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, first_name, avatar_url')
          .in('user_id', Array.from(userIds));
        
        if (profilesData) {
          profiles = Object.fromEntries(
            profilesData.map(p => [p.user_id, p])
          );
        }
      }

      return { goals, profiles };
    },
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: true, // Auto-refresh when user returns
    refetchOnMount: 'always', // Always check for updates on mount
  });
}

// Mutation for updating goals (invalidates cache automatically)
export function useUpdateGoal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ goalId, updates }: { goalId: string; updates: Partial<Goal> }) => {
      return goalsService.updateGoal(goalId, updates);
    },
    onSuccess: () => {
      // Invalidate all goal queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: goalsKeys.all });
    },
  });
}

// Mutation for deleting goals
export function useDeleteGoal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (goalId: string) => {
      return goalsService.deleteGoal(goalId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalsKeys.all });
    },
  });
}
