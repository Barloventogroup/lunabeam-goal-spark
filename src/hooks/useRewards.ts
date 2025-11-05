import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rewardsService, Reward } from '@/services/rewardsService';
import { toast } from 'sonner';

export function useRewards(activeOnly = false) {
  return useQuery({
    queryKey: ['rewards', activeOnly],
    queryFn: () => rewardsService.getRewards(activeOnly),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
}

export function useCreateReward() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (reward: Omit<Reward, 'id' | 'owner_id' | 'created_at' | 'updated_at'>) =>
      rewardsService.createReward(reward),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
      toast.success('Reward created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create reward: ${error.message}`);
    },
  });
}

export function useUpdateReward() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Reward> }) =>
      rewardsService.updateReward(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
      toast.success('Reward updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update reward: ${error.message}`);
    },
  });
}

export function useToggleRewardActive() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      rewardsService.toggleRewardActive(id, isActive),
    onMutate: async ({ id, isActive }) => {
      await queryClient.cancelQueries({ queryKey: ['rewards'] });
      
      const previousRewards = queryClient.getQueryData(['rewards', false]);
      
      queryClient.setQueriesData({ queryKey: ['rewards'] }, (old: Reward[] | undefined) =>
        old?.map(r => r.id === id ? { ...r, is_active: isActive } : r)
      );
      
      return { previousRewards };
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousRewards) {
        queryClient.setQueryData(['rewards', false], context.previousRewards);
      }
      toast.error(`Failed to update reward: ${error.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
    },
  });
}
