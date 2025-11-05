import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rewardsService, Redemption } from '@/services/rewardsService';
import { toast } from 'sonner';

export function useRedemptions(userId?: string) {
  return useQuery({
    queryKey: ['redemptions', userId],
    queryFn: () => rewardsService.getRedemptions(userId),
    staleTime: 30 * 1000, // 30 seconds (more frequent for real-time feel)
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

export function useRequestRedemption() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (rewardId: string) => rewardsService.requestRedemption(rewardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['redemptions'] });
      queryClient.invalidateQueries({ queryKey: ['userPoints'] });
      toast.success('Redemption requested! Your supporter will review it.');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useApproveRedemption() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (redemptionId: string) => rewardsService.approveRedemption(redemptionId),
    onMutate: async (redemptionId) => {
      await queryClient.cancelQueries({ queryKey: ['redemptions'] });
      
      const previousRedemptions = queryClient.getQueryData(['redemptions']);
      
      queryClient.setQueriesData({ queryKey: ['redemptions'] }, (old: Redemption[] | undefined) =>
        old?.map(r => r.id === redemptionId 
          ? { ...r, status: 'approved' as const, approved_at: new Date().toISOString() } 
          : r
        )
      );
      
      return { previousRedemptions };
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousRedemptions) {
        queryClient.setQueriesData({ queryKey: ['redemptions'] }, context.previousRedemptions);
      }
      toast.error(`Failed to approve: ${error.message}`);
    },
    onSuccess: () => {
      toast.success('Redemption approved! Points deducted.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['redemptions'] });
      queryClient.invalidateQueries({ queryKey: ['userPoints'] });
    },
  });
}

export function useDenyRedemption() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ redemptionId, notes }: { redemptionId: string; notes?: string }) =>
      rewardsService.denyRedemption(redemptionId, notes),
    onMutate: async ({ redemptionId }) => {
      await queryClient.cancelQueries({ queryKey: ['redemptions'] });
      
      const previousRedemptions = queryClient.getQueryData(['redemptions']);
      
      queryClient.setQueriesData({ queryKey: ['redemptions'] }, (old: Redemption[] | undefined) =>
        old?.map(r => r.id === redemptionId 
          ? { ...r, status: 'denied' as const, approved_at: new Date().toISOString() } 
          : r
        )
      );
      
      return { previousRedemptions };
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousRedemptions) {
        queryClient.setQueriesData({ queryKey: ['redemptions'] }, context.previousRedemptions);
      }
      toast.error(`Failed to deny: ${error.message}`);
    },
    onSuccess: () => {
      toast.success('Redemption denied');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['redemptions'] });
    },
  });
}

export function useFulfillRedemption() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (redemptionId: string) => rewardsService.fulfillRedemption(redemptionId),
    onMutate: async (redemptionId) => {
      await queryClient.cancelQueries({ queryKey: ['redemptions'] });
      
      const previousRedemptions = queryClient.getQueryData(['redemptions']);
      
      queryClient.setQueriesData({ queryKey: ['redemptions'] }, (old: Redemption[] | undefined) =>
        old?.map(r => r.id === redemptionId 
          ? { ...r, status: 'fulfilled' as const, fulfilled_at: new Date().toISOString() } 
          : r
        )
      );
      
      return { previousRedemptions };
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousRedemptions) {
        queryClient.setQueriesData({ queryKey: ['redemptions'] }, context.previousRedemptions);
      }
      toast.error(`Failed to fulfill: ${error.message}`);
    },
    onSuccess: () => {
      toast.success('Redemption marked as fulfilled!');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['redemptions'] });
    },
  });
}
