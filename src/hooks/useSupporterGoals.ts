import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { GoalStatus } from '@/types';

interface Goal {
  id: string;
  title: string;
  description: string | null;
  status: GoalStatus;
  progress_pct: number;
  domain: string | null;
  start_date: string | null;
  due_date: string | null;
  owner_id: string;
  owner_name?: string;
  earned_points: number;
}

interface SupporterGoalsData {
  goals: Goal[];
  totalCount: number;
}

export function useSupporterGoals(
  userId: string | undefined,
  selectedIndividualId: string | undefined,
  filter: GoalStatus | 'all',
  page: number = 0,
  pageSize: number = 20
) {
  return useQuery({
    queryKey: ['supporter-goals', userId, selectedIndividualId, filter, page],
    queryFn: async (): Promise<SupporterGoalsData> => {
      if (!userId) throw new Error('User ID required');

      let individualIds: string[] = [];

      // Get individual IDs to query
      if (selectedIndividualId) {
        individualIds = [selectedIndividualId];
      } else {
        const { data: supporters } = await supabase
          .from('supporters')
          .select('individual_id')
          .eq('supporter_id', userId);
        
        individualIds = supporters?.map(s => s.individual_id) || [];
      }

      if (individualIds.length === 0) {
        return { goals: [], totalCount: 0 };
      }

      // Build query with pagination
      let query = supabase
        .from('goals')
        .select('*', { count: 'exact' })
        .in('owner_id', individualIds)
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      // Apply status filter
      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data: goals, error, count } = await query;

      if (error) throw error;

      // Batch fetch owner profiles
      const ownerIds = [...new Set(goals?.map(g => g.owner_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name')
        .in('user_id', ownerIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.first_name]) || []);

      // Enrich goals with owner names
      const enrichedGoals: Goal[] = (goals || []).map(goal => ({
        id: goal.id,
        title: goal.title,
        description: goal.description,
        status: goal.status as GoalStatus,
        progress_pct: goal.progress_pct || 0,
        domain: goal.domain,
        start_date: goal.start_date,
        due_date: goal.due_date,
        owner_id: goal.owner_id,
        owner_name: profileMap.get(goal.owner_id) || 'Unknown',
        earned_points: goal.earned_points || 0,
      }));

      return {
        goals: enrichedGoals,
        totalCount: count || 0,
      };
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
}
