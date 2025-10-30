import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Target, User, Calendar, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { useSupporterGoals } from '@/hooks/useSupporterGoals';
import type { GoalStatus } from '@/types';


interface SupporterGoalsViewProps {
  selectedIndividualId?: string;
}

export const SupporterGoalsView: React.FC<SupporterGoalsViewProps> = ({
  selectedIndividualId
}) => {
  const { user } = useAuth();
  const [filter, setFilter] = useState<GoalStatus | 'all'>('all');
  const [page] = useState(0);

  // Use optimized hook with React Query caching
  const { data, isLoading: loading } = useSupporterGoals(
    user?.id,
    selectedIndividualId,
    filter,
    page
  );

  const goals = data?.goals || [];
  const totalGoalsCount = data?.totalCount || 0;

  const getStatusColor = (status: string): "activeGreen" | "default" | "secondary" | "planned" => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'active':
        return 'activeGreen';
      case 'paused':
        return 'secondary';
      case 'planned':
        return 'planned';
      default:
        return 'default';
    }
  };

  const getDomainColor = (domain?: string) => {
    switch (domain) {
      case 'education':
        return 'bg-purple-500/10 text-purple-700';
      case 'independent-living':
        return 'bg-green-500/10 text-green-700';
      case 'employment':
        return 'bg-blue-500/10 text-blue-700';
      case 'social':
        return 'bg-pink-500/10 text-pink-700';
      case 'health':
        return 'bg-red-500/10 text-red-700';
      default:
        return 'bg-gray-500/10 text-gray-700';
    }
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {selectedIndividualId ? 'Individual Goals' : 'All Goals'}
          </h1>
          <p className="text-muted-foreground">
            Monitor progress and provide support
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
          {/* Goal Count Indicator */}
          <Badge 
            variant={filter !== 'all' ? "default" : "secondary"}
            className="text-xs font-medium"
          >
            {filter === 'all' ? (
              <span>{totalGoalsCount} {totalGoalsCount === 1 ? 'goal' : 'goals'}</span>
            ) : (
              <span>{goals.length} of {totalGoalsCount} goals</span>
            )}
          </Badge>
          
          {/* Filter Buttons */}
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'active' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('active')}
            >
              Active
            </Button>
            <Button
              variant={filter === 'completed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('completed')}
            >
              Completed
            </Button>
          </div>
        </div>
      </div>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <div className="text-center py-12">
          <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No goals found</h3>
          <p className="text-muted-foreground">
            {filter === 'all' 
              ? "The individuals you support haven't created any goals yet."
              : `No ${filter} goals found.`
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {goals.map((goal) => (
            <Card key={goal.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-sm line-clamp-2">
                          {goal.title}
                        </h3>
                        <Badge variant={getStatusColor(goal.status)}>
                          {goal.status}
                        </Badge>
                      </div>
                      
                      {goal.description && (
                        <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                          {goal.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>{goal.owner_name}</span>
                        </div>
                        
                        {goal.domain && (
                          <Badge variant="secondary" className={getDomainColor(goal.domain)}>
                            {goal.domain.replace('-', ' ')}
                          </Badge>
                        )}
                        
                        {goal.due_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>Due {new Date(goal.due_date).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{Math.round(goal.progress_pct)}%</span>
                    </div>
                    <Progress value={goal.progress_pct} className="h-2" />
                  </div>

                  {/* Points */}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Points Earned</span>
                    <span className="font-medium">
                      {goal.earned_points} pts
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};