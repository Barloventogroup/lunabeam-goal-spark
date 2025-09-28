import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Target, Users, Calendar, TrendingUp, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';
import { toast } from 'sonner';

interface SupportedIndividual {
  id: string;
  first_name: string;
  avatar_url?: string;
  role: string;
  permission_level: string;
  active_goals: number;
  completed_goals: number;
  total_points: number;
  recent_activity: string;
}

interface SupporterHomeDashboardProps {
  onNavigateToGoals: (individualId?: string) => void;
  onNavigateToIndividual: (individualId: string) => void;
}

export const SupporterHomeDashboard: React.FC<SupporterHomeDashboardProps> = ({
  onNavigateToGoals,
  onNavigateToIndividual
}) => {
  const { user } = useAuth();
  const [supportedIndividuals, setSupportedIndividuals] = useState<SupportedIndividual[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalIndividuals: 0,
    totalActiveGoals: 0,
    totalCompletedGoals: 0,
    weeklyProgress: 0
  });

  useEffect(() => {
    if (user) {
      loadSupporterData();
    }
  }, [user]);

  const loadSupporterData = async () => {
    if (!user) return;

    try {
      // Get all individuals I support
      const { data: supporters, error: supportersError } = await supabase
        .from('supporters')
        .select(`
          individual_id,
          role,
          permission_level
        `)
        .eq('supporter_id', user.id);

      if (supportersError) throw supportersError;

      const individualsData: SupportedIndividual[] = [];
      let totalActiveGoals = 0;
      let totalCompletedGoals = 0;

      for (const supporter of supporters || []) {
        const individualId = supporter.individual_id;
        
        // Get profile data separately
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, avatar_url')
          .eq('user_id', individualId)
          .single();

        // Get goals count for this individual
        const { data: goals, error: goalsError } = await supabase
          .from('goals')
          .select('status')
          .eq('owner_id', individualId);

        if (goalsError) {
          console.error('Error loading goals for individual:', goalsError);
          continue;
        }

        const activeGoals = goals?.filter(g => g.status === 'active').length || 0;
        const completedGoals = goals?.filter(g => g.status === 'completed').length || 0;

        totalActiveGoals += activeGoals;
        totalCompletedGoals += completedGoals;

        // Get total points for this individual
        const { data: points } = await supabase
          .from('user_points')
          .select('total_points')
          .eq('user_id', individualId);

        const totalPoints = points?.reduce((sum, p) => sum + p.total_points, 0) || 0;

        individualsData.push({
          id: individualId,
          first_name: profile?.first_name || 'User',
          avatar_url: profile?.avatar_url,
          role: supporter.role,
          permission_level: supporter.permission_level,
          active_goals: activeGoals,
          completed_goals: completedGoals,
          total_points: totalPoints,
          recent_activity: activeGoals > 0 ? 'Working on goals' : 'No active goals'
        });
      }

      setSupportedIndividuals(individualsData);
      setStats({
        totalIndividuals: individualsData.length,
        totalActiveGoals,
        totalCompletedGoals,
        weeklyProgress: Math.round((totalCompletedGoals / Math.max(totalActiveGoals + totalCompletedGoals, 1)) * 100)
      });

    } catch (error) {
      console.error('Error loading supporter data:', error);
      toast.error('Failed to load supporter dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Welcome Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Support Dashboard
        </h1>
        <p className="text-muted-foreground">
          Monitor progress and support your team members
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.totalIndividuals}</p>
                <p className="text-xs text-muted-foreground">Supported</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.totalActiveGoals}</p>
                <p className="text-xs text-muted-foreground">Active Goals</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.totalCompletedGoals}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.weeklyProgress}%</p>
                <p className="text-xs text-muted-foreground">Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Supported Individuals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Your Support Team
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {supportedIndividuals.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                You're not supporting anyone yet.
              </p>
            </div>
          ) : (
            supportedIndividuals.map((individual) => (
              <div
                key={individual.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    {individual.avatar_url ? (
                      <img 
                        src={individual.avatar_url} 
                        alt={individual.first_name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-primary font-semibold">
                        {individual.first_name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{individual.first_name}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {individual.role}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {individual.active_goals} active goals
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-right">
                    <p className="text-sm font-medium">{individual.total_points} pts</p>
                    <p className="text-xs text-muted-foreground">{individual.recent_activity}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onNavigateToIndividual(individual.id)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button
          onClick={() => onNavigateToGoals()}
          className="p-6 h-auto flex-col space-y-2"
          variant="outline"
        >
          <Target className="h-8 w-8" />
          <span>View All Goals</span>
        </Button>
        
        <Button
          onClick={() => onNavigateToIndividual('')}
          className="p-6 h-auto flex-col space-y-2"
          variant="outline"
        >
          <Users className="h-8 w-8" />
          <span>Manage Support Team</span>
        </Button>
      </div>
    </div>
  );
};