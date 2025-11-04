import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';

export type StudentStatus = 'on_track' | 'at_risk' | 'stuck' | 'no_data';

export interface StudentData {
  userId: string;
  firstName: string;
  avatarUrl: string | null;
  grade?: string;
  cohortId?: string;
  cohortName?: string;
  status: StudentStatus;
  currentGoal?: {
    id: string;
    title: string;
    type: string;
  };
  thisWeekProgress: {
    completed: number;
    planned: number;
    percentage: number;
  };
  streakDays: number;
  overdueCount: number;
  lastCheckIn?: Date;
  averageDifficulty?: number;
  recentBlockers?: string[];
}

export interface CoachDashboardStats {
  onTrack: number;
  atRisk: number;
  stuck: number;
  noData: number;
  totalOverdue: number;
  interventionsLast7Days: number;
}

export interface CoachDashboardData {
  students: StudentData[];
  stats: CoachDashboardStats;
  cohorts: Array<{ id: string; name: string }>;
}

export interface CoachDashboardFilters {
  cohortId?: string;
  grade?: string;
  status?: StudentStatus;
  supporterScope?: 'me' | 'all';
}

export function useCoachDashboard(filters: CoachDashboardFilters = {}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['coach-dashboard', user?.id, filters],
    queryFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');

      // 1. Get coach relationships
      const { data: relationships, error: relError } = await supabase
        .from('supporters')
        .select('individual_id, role')
        .eq('supporter_id', user.id)
        .in('role', ['coach', 'teacher']);

      if (relError) throw relError;
      if (!relationships?.length) {
        return { students: [], stats: getEmptyStats(), cohorts: [] };
      }

      const individualIds = relationships.map(r => r.individual_id);

      // 2. Get cohorts and members
      const { data: cohortMembers } = await supabase
        .from('cohort_members')
        .select(`
          individual_id,
          cohort_id,
          cohorts (
            id,
            name
          )
        `)
        .in('individual_id', individualIds);

      const cohortMap = new Map<string, { id: string; name: string }>();
      const individualCohortMap = new Map<string, { id: string; name: string }>();
      
      cohortMembers?.forEach(cm => {
        if (cm.cohorts) {
          cohortMap.set(cm.cohorts.id, { id: cm.cohorts.id, name: cm.cohorts.name });
          individualCohortMap.set(cm.individual_id, { id: cm.cohorts.id, name: cm.cohorts.name });
        }
      });

      // Apply cohort filter
      let filteredIndividualIds = individualIds;
      if (filters.cohortId) {
        filteredIndividualIds = individualIds.filter(id => 
          individualCohortMap.get(id)?.id === filters.cohortId
        );
      }

      // 3. Batch fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, avatar_url, grade')
        .in('user_id', filteredIndividualIds);

      // Apply grade filter
      if (filters.grade && profiles) {
        filteredIndividualIds = profiles
          .filter(p => p.grade === filters.grade)
          .map(p => p.user_id);
      }

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // 4. Get current active goals
      const { data: goals } = await supabase
        .from('goals')
        .select('id, owner_id, title, goal_type, status')
        .in('owner_id', filteredIndividualIds)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      const goalMap = new Map(goals?.map(g => [g.owner_id, g]) || []);

      // 5. Get steps for this week
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const { data: steps } = await supabase
        .from('steps')
        .select('id, goal_id, status, due_date, updated_at')
        .in('goal_id', goals?.map(g => g.id) || [])
        .gte('due_date', weekStart.toISOString().split('T')[0]);

      // 6. Get check-ins (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: checkIns } = await supabase
        .from('check_ins')
        .select('user_id, goal_id, created_at, difficulty, blocker_tags')
        .in('user_id', filteredIndividualIds)
        .gte('created_at', sevenDaysAgo.toISOString());

      // 7. Get support actions (last 7 days)
      const { data: supportActions } = await supabase
        .from('support_actions')
        .select('student_id, coach_id, created_at')
        .in('student_id', filteredIndividualIds)
        .gte('at_ts', sevenDaysAgo.toISOString());

      // Apply supporter scope filter
      let filteredSupportActions = supportActions || [];
      if (filters.supporterScope === 'me') {
        filteredSupportActions = filteredSupportActions.filter(sa => sa.coach_id === user.id);
      }

      // Calculate student data and statuses
      const students: StudentData[] = filteredIndividualIds.map(individualId => {
        const profile = profileMap.get(individualId);
        const goal = goalMap.get(individualId);
        const cohort = individualCohortMap.get(individualId);

        const studentSteps = steps?.filter(s => s.goal_id === goal?.id) || [];
        const studentCheckIns = checkIns?.filter(ci => ci.user_id === individualId) || [];

        const completed = studentSteps.filter(s => s.status === 'done').length;
        const planned = studentSteps.length;
        const overdue = studentSteps.filter(s => 
          s.status !== 'done' && s.due_date && new Date(s.due_date) < new Date()
        ).length;

        const oldestOverdue = studentSteps
          .filter(s => s.status !== 'done' && s.due_date && new Date(s.due_date) < new Date())
          .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())[0];

        const hoursOverdue = oldestOverdue 
          ? (Date.now() - new Date(oldestOverdue.due_date!).getTime()) / (1000 * 60 * 60)
          : 0;

        const lastCheckIn = studentCheckIns.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];

        const hoursSinceCheckIn = lastCheckIn
          ? (Date.now() - new Date(lastCheckIn.created_at).getTime()) / (1000 * 60 * 60)
          : 999;

        const avgDifficulty = studentCheckIns.length > 0
          ? studentCheckIns.reduce((sum, ci) => sum + (ci.difficulty || 0), 0) / studentCheckIns.length
          : 0;

        const recentBlockers = studentCheckIns
          .flatMap(ci => ci.blocker_tags || [])
          .filter(tag => tag !== 'none');

        // Calculate streak
        const completedSteps = studentSteps
          .filter(s => s.status === 'done' && s.updated_at)
          .sort((a, b) => new Date(b.updated_at!).getTime() - new Date(a.updated_at!).getTime());

        let streak = 0;
        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        for (const step of completedSteps) {
          const stepDate = new Date(step.updated_at!);
          stepDate.setHours(0, 0, 0, 0);
          const daysDiff = Math.floor((currentDate.getTime() - stepDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDiff === streak) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
          } else {
            break;
          }
        }

        // Determine status
        let status: StudentStatus = 'on_track';

        if (planned === 0 || hoursSinceCheckIn > 168) {
          status = 'no_data';
        } else if (overdue >= 3 || hoursOverdue > 72 || (avgDifficulty > 2.5 && hoursSinceCheckIn > 48)) {
          status = 'stuck';
        } else if (overdue >= 1 || avgDifficulty > 2.3 || (planned > 0 && completed / planned < 0.6)) {
          status = 'at_risk';
        }

        return {
          userId: individualId,
          firstName: profile?.first_name || 'Student',
          avatarUrl: profile?.avatar_url || null,
          grade: profile?.grade,
          cohortId: cohort?.id,
          cohortName: cohort?.name,
          status,
          currentGoal: goal ? {
            id: goal.id,
            title: goal.title,
            type: goal.goal_type || 'habit'
          } : undefined,
          thisWeekProgress: {
            completed,
            planned,
            percentage: planned > 0 ? Math.round((completed / planned) * 100) : 0
          },
          streakDays: streak,
          overdueCount: overdue,
          lastCheckIn: lastCheckIn ? new Date(lastCheckIn.created_at) : undefined,
          averageDifficulty: avgDifficulty,
          recentBlockers: [...new Set(recentBlockers)]
        };
      });

      // Apply status filter
      const filteredStudents = filters.status
        ? students.filter(s => s.status === filters.status)
        : students;

      // Calculate stats
      const stats: CoachDashboardStats = {
        onTrack: students.filter(s => s.status === 'on_track').length,
        atRisk: students.filter(s => s.status === 'at_risk').length,
        stuck: students.filter(s => s.status === 'stuck').length,
        noData: students.filter(s => s.status === 'no_data').length,
        totalOverdue: students.reduce((sum, s) => sum + s.overdueCount, 0),
        interventionsLast7Days: filteredSupportActions.length
      };

      return {
        students: filteredStudents,
        stats,
        cohorts: Array.from(cohortMap.values())
      };
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 2 * 60 * 1000, // Auto-refresh every 2 minutes
  });
}

function getEmptyStats(): CoachDashboardStats {
  return {
    onTrack: 0,
    atRisk: 0,
    stuck: 0,
    noData: 0,
    totalOverdue: 0,
    interventionsLast7Days: 0
  };
}
