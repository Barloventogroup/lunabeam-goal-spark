import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Target, User, Calendar, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';
import { toast } from 'sonner';

interface Goal {
  id: string;
  title: string;
  description?: string;
  status: string;
  progress_pct: number;
  domain?: string;
  start_date?: string;
  due_date?: string;
  owner_name: string;
  owner_id: string;
  earned_points: number;
  total_possible_points: number;
}

interface SupporterGoalsViewProps {
  selectedIndividualId?: string;
}

export const SupporterGoalsView: React.FC<SupporterGoalsViewProps> = ({
  selectedIndividualId
}) => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [totalGoalsCount, setTotalGoalsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    if (user) {
      loadGoals();
    }
  }, [user, selectedIndividualId, filter]);

  const loadGoals = async () => {
    if (!user) return;

    try {
      // Fetch supporters once and reuse
      let individualIds: string[] = [];

      if (!selectedIndividualId) {
        const { data: supporters } = await supabase
          .from('supporters')
          .select('individual_id')
          .eq('supporter_id', user.id);

        individualIds = supporters?.map(s => s.individual_id) || [];

        if (individualIds.length === 0) {
          setGoals([]);
          setLoading(false);
          return;
        }
      }

      // Build goals query
      let query = supabase
        .from('goals')
        .select(`
          id,
          title,
          description,
          status,
          progress_pct,
          domain,
          start_date,
          due_date,
          earned_points,
          total_possible_points,
          owner_id
        `);

      if (selectedIndividualId) {
        // Show goals for specific individual
        query = query.eq('owner_id', selectedIndividualId);
      } else {
        // Use the individualIds we already fetched
        query = query.in('owner_id', individualIds);
      }

      // Get total count before filtering
      let countQuery = supabase
        .from('goals')
        .select('id', { count: 'exact', head: true });

      if (selectedIndividualId) {
        countQuery = countQuery.eq('owner_id', selectedIndividualId);
      } else {
        // Reuse the same individualIds array
        countQuery = countQuery.in('owner_id', individualIds);
      }

      const { count: totalCount } = await countQuery;

      if (totalCount !== null) {
        setTotalGoalsCount(totalCount);
      }

      if (filter !== 'all') {
        query = query.eq('status', filter === 'active' ? 'active' : 'completed');
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Batch profile fetching - collect unique owner IDs
      const ownerIds = [...new Set((data || []).map(g => g.owner_id).filter(Boolean))];

      // Fetch all profiles in one query
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name')
        .in('user_id', ownerIds);

      // Build lookup map for O(1) access
      const profileMap = new Map(
        (profiles || []).map(p => [p.user_id, p])
      );

      // Attach owner names using the map
      const goalsWithOwner = (data || []).map(goal => ({
        ...goal,
        owner_name: profileMap.get(goal.owner_id)?.first_name || 'User'
      }));

      setGoals(goalsWithOwner);

    } catch (error) {
      console.error('Error loading goals:', error);
      toast.error('Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-700 border-green-200';
      case 'active':
        return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'planned':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
                        <h3 className="font-semibold text-lg line-clamp-2">
                          {goal.title}
                        </h3>
                        <Badge className={getStatusColor(goal.status)}>
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
                      {goal.earned_points} / {goal.total_possible_points}
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