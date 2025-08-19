import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Target, Flag } from 'lucide-react';
import { goalsService, stepsService } from '@/services/goalsService';
import type { Goal, Step } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface GoalsListProps {
  onNavigate: (view: string, goalId?: string) => void;
}

export const GoalsList: React.FC<GoalsListProps> = ({ onNavigate }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [stepsCount, setStepsCount] = useState<Record<string, { required: number; done: number }>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadGoals = async () => {
    try {
      const goalsData = await goalsService.getGoals();
      setGoals(goalsData);

      // Load step counts for each goal
      const counts: Record<string, { required: number; done: number }> = {};
      for (const goal of goalsData) {
        const steps = await stepsService.getSteps(goal.id);
        const requiredSteps = steps.filter(step => step.is_required);
        const doneRequired = requiredSteps.filter(step => step.status === 'done');
        counts[goal.id] = {
          required: requiredSteps.length,
          done: doneRequired.length
        };
      }
      setStepsCount(counts);
    } catch (error) {
      console.error('Failed to load goals:', error);
      toast({
        title: 'Error',
        description: 'Failed to load goals. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGoals();
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'completed': return 'default';
      case 'paused': return 'secondary';
      case 'planned': return 'outline';
      default: return 'default';
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Goals</h2>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          Loading goals...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Target className="h-6 w-6" />
          Goals
        </h2>
        <Button onClick={() => onNavigate('create-goal')}>
          <Plus className="h-4 w-4 mr-2" />
          New Goal
        </Button>
      </div>

      {goals.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No goals yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first goal to get started on your journey!
            </p>
            <Button onClick={() => onNavigate('create-goal')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Goal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => {
            const stepCount = stepsCount[goal.id] || { required: 0, done: 0 };
            const progressPct = goal.progress_pct || 0;

            return (
              <Card 
                key={goal.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onNavigate('goal-detail', goal.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{goal.title}</CardTitle>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={getStatusColor(goal.status)}>
                          {goal.status}
                        </Badge>
                        <Badge variant={getPriorityColor(goal.priority)}>
                          <Flag className="h-3 w-3 mr-1" />
                          {goal.priority}
                        </Badge>
                        {goal.domain && (
                          <Badge variant="outline">{goal.domain}</Badge>
                        )}
                      </div>
                      {goal.due_date && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          Due {formatDate(goal.due_date)}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        {Math.round(progressPct)}%
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {stepCount.done} of {stepCount.required} steps done
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {goal.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {goal.description}
                    </p>
                  )}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span>Progress</span>
                      <span>{stepCount.done}/{stepCount.required} steps</span>
                    </div>
                    <Progress value={progressPct} className="h-2" />
                  </div>
                  {goal.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {goal.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};