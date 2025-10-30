import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SupportedIndividual {
  user_id: string;
  first_name: string;
  avatar_url: string | null;
  role: string;
  activeGoalsCount: number;
  completedGoalsCount: number;
  totalPoints: number;
}

interface DashboardStats {
  totalSupported: number;
  totalActiveGoals: number;
  totalCompletedGoals: number;
  averageProgress: number;
}

interface SupporterDashboardData {
  supportedIndividuals: SupportedIndividual[];
  stats: DashboardStats;
}

export function useSupporterDashboard(userId: string | undefined) {
  return useQuery({
    queryKey: ['supporter-dashboard', userId],
    queryFn: async (): Promise<SupporterDashboardData> => {
      if (!userId) throw new Error('User ID required');

      // Step 1: Get all supporter relationships in one query
      const { data: relationships, error: relError } = await supabase
        .from('supporters')
        .select('individual_id, role')
        .eq('supporter_id', userId);

      if (relError) throw relError;
      if (!relationships || relationships.length === 0) {
        return { supportedIndividuals: [], stats: { totalSupported: 0, totalActiveGoals: 0, totalCompletedGoals: 0, averageProgress: 0 } };
      }

      const individualIds = relationships.map(r => r.individual_id);

      // Step 2: Batch fetch all data in parallel
      const [profilesResult, goalsResult, pointsResult] = await Promise.all([
        // Fetch all profiles
        supabase
          .from('profiles')
          .select('user_id, first_name, avatar_url')
          .in('user_id', individualIds),
        
        // Fetch all goals with status
        supabase
          .from('goals')
          .select('owner_id, status')
          .in('owner_id', individualIds),
        
        // Fetch all points
        supabase
          .from('user_points')
          .select('user_id, total_points')
          .in('user_id', individualIds)
      ]);

      if (profilesResult.error) throw profilesResult.error;
      if (goalsResult.error) throw goalsResult.error;
      if (pointsResult.error) throw pointsResult.error;

      // Step 3: Process data on the frontend
      const profiles = profilesResult.data || [];
      const goals = goalsResult.data || [];
      const points = pointsResult.data || [];

      // Create lookup maps
      const roleMap = new Map(relationships.map(r => [r.individual_id, r.role]));
      const pointsMap = new Map(
        points.map(p => [
          p.user_id, 
          p.total_points
        ])
      );

      // Calculate goals per individual
      const goalsMap = new Map<string, { active: number; completed: number }>();
      goals.forEach(goal => {
        const current = goalsMap.get(goal.owner_id) || { active: 0, completed: 0 };
        if (goal.status === 'active' || goal.status === 'in_progress') {
          current.active++;
        } else if (goal.status === 'completed') {
          current.completed++;
        }
        goalsMap.set(goal.owner_id, current);
      });

      // Build supported individuals array
      const supportedIndividuals: SupportedIndividual[] = profiles.map(profile => {
        const goalStats = goalsMap.get(profile.user_id) || { active: 0, completed: 0 };
        const userPoints = pointsMap.get(profile.user_id) || 0;
        
        return {
          user_id: profile.user_id,
          first_name: profile.first_name || 'User',
          avatar_url: profile.avatar_url,
          role: roleMap.get(profile.user_id) || 'supporter',
          activeGoalsCount: goalStats.active,
          completedGoalsCount: goalStats.completed,
          totalPoints: userPoints,
        };
      });

      // Calculate aggregate stats
      const stats: DashboardStats = {
        totalSupported: supportedIndividuals.length,
        totalActiveGoals: supportedIndividuals.reduce((sum, ind) => sum + ind.activeGoalsCount, 0),
        totalCompletedGoals: supportedIndividuals.reduce((sum, ind) => sum + ind.completedGoalsCount, 0),
        averageProgress: supportedIndividuals.length > 0
          ? supportedIndividuals.reduce((sum, ind) => {
              const total = ind.activeGoalsCount + ind.completedGoalsCount;
              const progress = total > 0 ? (ind.completedGoalsCount / total) * 100 : 0;
              return sum + progress;
            }, 0) / supportedIndividuals.length
          : 0,
      };

      return { supportedIndividuals, stats };
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
}
