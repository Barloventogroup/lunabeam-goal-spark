import { useQuery } from '@tanstack/react-query';
import { stepsService } from '@/services/goalsService';
import type { Step } from '@/types';

export const goalStepsKeys = {
  all: ['goalSteps'] as const,
  list: (goalId: string) => ['goalSteps', goalId] as const,
};

export function useGoalSteps(goalId: string) {
  return useQuery<Step[]>({
    queryKey: goalStepsKeys.list(goalId),
    queryFn: async () => stepsService.getSteps(goalId),
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!goalId,
    refetchOnWindowFocus: false,
  });
}
