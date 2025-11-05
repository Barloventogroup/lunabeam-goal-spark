import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useRewardPoints(userId?: string) {
  return useQuery({
    queryKey: ['userPoints', userId],
    queryFn: async () => {
      const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;
      if (!targetUserId) throw new Error('No user ID');

      const { data, error } = await supabase.rpc('get_user_total_points', {
        p_user_id: targetUserId
      });

      if (error) throw error;
      return data as number;
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
