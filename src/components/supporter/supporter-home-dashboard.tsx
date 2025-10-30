import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Target, Users, Calendar, TrendingUp, ChevronRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { useSupporterDashboard } from '@/hooks/useSupporterDashboard';


interface SupporterHomeDashboardProps {
  onNavigateToGoals: (individualId?: string) => void;
  onNavigateToIndividual: (individualId: string) => void;
  onNavigateToNotifications: () => void;
}

export const SupporterHomeDashboard: React.FC<SupporterHomeDashboardProps> = ({
  onNavigateToGoals,
  onNavigateToIndividual,
  onNavigateToNotifications
}) => {
  const { user } = useAuth();
  
  // Use optimized hook with React Query caching
  const { data, isLoading: loading } = useSupporterDashboard(user?.id);
  
  const supportedIndividuals = data?.supportedIndividuals || [];
  const stats = {
    totalIndividuals: data?.stats.totalSupported || 0,
    totalActiveGoals: data?.stats.totalActiveGoals || 0,
    totalCompletedGoals: data?.stats.totalCompletedGoals || 0,
    weeklyProgress: Math.round(data?.stats.averageProgress || 0)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                key={individual.user_id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    {individual.avatar_url ? (
                      <img 
                        src={`${individual.avatar_url}${individual.updated_at ? `?v=${new Date(individual.updated_at).getTime()}` : ''}`} 
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
                        {individual.activeGoalsCount} active goals
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-right">
                    <p className="text-sm font-medium">{individual.totalPoints} pts</p>
                    <p className="text-xs text-muted-foreground">
                      {individual.activeGoalsCount > 0 ? 'Working on goals' : 'No active goals'}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onNavigateToIndividual(individual.user_id)}
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