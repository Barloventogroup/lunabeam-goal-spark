import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Calendar, Target, Flag, MoreVertical, Trash2 } from 'lucide-react';
import { goalsService, stepsService } from '@/services/goalsService';
import type { Goal, Step } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface GoalsListProps {
  onNavigate: (view: string, goalId?: string) => void;
}

type GoalsTab = 'active' | 'completed';

export const GoalsList: React.FC<GoalsListProps> = ({ onNavigate }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [stepsCount, setStepsCount] = useState<Record<string, { required: number; done: number }>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<GoalsTab>('active');
  const { toast } = useToast();

  const loadGoals = async () => {
    try {
      let goalsData: Goal[];
      
      if (activeTab === 'completed') {
        // Get completed goals
        goalsData = await goalsService.getGoals({ 
          status: 'completed' 
        });
      } else {
        // Get active goals (planned, active, paused - not completed or archived)
        const allGoals = await goalsService.getGoals();
        goalsData = allGoals.filter(goal => 
          goal.status !== 'completed' && goal.status !== 'archived'
        );
      }
      
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
        title: 'Trouble loading your goals',
        description: 'Give it a refresh when you\'re ready',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGoals();
  }, [activeTab]); // Reload when tab changes

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
      case 'active': return 'active';
      case 'completed': return 'default';
      case 'paused': return 'secondary';
      case 'planned': return 'planned';
      default: return 'default';
    }
  };

  const handleDeleteGoal = async (goalId: string, goalTitle: string) => {
    try {
      await goalsService.deleteGoal(goalId);
      
      toast({
        title: 'Goal archived',
        description: `"${goalTitle}" has been moved to your archive`,
      });
      
      // Reload goals to reflect the change
      loadGoals();
    } catch (error) {
      console.error('Failed to delete goal:', error);
      toast({
        title: 'Couldn\'t archive goal',
        description: 'Something went wrong. Give it another try.',
        variant: 'destructive'
      });
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString();
  };

  if (loading) {
    return null; // Don't show loading state
  }

  return (
    <div className="space-y-4 px-4 pt-6">
      <div className="flex justify-between items-center">
        <h2 className="flex items-center gap-2">
          <Target className="h-6 w-6" />
          Goals
        </h2>
        
        {/* Circular Add Button */}
        <Button 
          onClick={() => onNavigate('create-goal')}
          className="w-10 h-10 rounded-full p-0 bg-primary hover:bg-primary/90"
          size="sm"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {/* Tab Buttons */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg">
        <Button
          variant={activeTab === 'active' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('active')}
          className="flex-1 text-sm"
        >
          Active
        </Button>
        <Button
          variant={activeTab === 'completed' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('completed')}
          className="flex-1 text-sm"
        >
          Completed
        </Button>
      </div>

      {goals.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3>
              {activeTab === 'completed' ? 'No completed goals yet' : 'No active goals yet'}
            </h3>
            <p className="text-body-sm text-muted-foreground mb-4">
              {activeTab === 'completed' 
                ? 'Complete some goals to see them here!'
                : 'Create your first goal to get started on your journey!'
              }
            </p>
            {activeTab === 'active' && (
              <Button onClick={() => onNavigate('create-goal')} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Goal
              </Button>
            )}
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
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => onNavigate('goal-detail', goal.id)}
                    >
                      <h4 className="mb-2">{goal.title}</h4>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={getStatusColor(goal.status)}>
                          {goal.status}
                        </Badge>
                        <Badge variant={getPriorityColor(goal.priority)}>
                          <Flag className="h-3 w-3 mr-1" />
                          {goal.priority}
                        </Badge>
                        {goal.domain && (
                          <Badge variant="category">{goal.domain}</Badge>
                        )}
                      </div>
                      {goal.due_date && (
                        <div className="flex items-center gap-1 text-body-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          Due {formatDate(goal.due_date)}
                        </div>
                      )}
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="text-right">
                        <div className="text-3xl font-bold text-primary">
                          {Math.round(progressPct)}%
                        </div>
                        <div className="text-caption">
                          {stepCount.done} of {stepCount.required} steps done
                        </div>
                      </div>
                      
                      {/* Goal Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 bg-background border shadow-lg z-50">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive cursor-pointer"
                                onSelect={(e) => e.preventDefault()}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Archive Goal
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Archive this goal?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  "{goal.title}" will be moved to your archive. You can always restore it later if needed.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Keep Goal</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteGoal(goal.id, goal.title)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Archive Goal
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent onClick={() => onNavigate('goal-detail', goal.id)}>
                  {goal.description && (
                    <p className="text-body-sm text-muted-foreground mb-3 line-clamp-2">
                      {goal.description}
                    </p>
                  )}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-body-sm">
                      <span>Progress</span>
                      <span>{stepCount.done}/{stepCount.required} steps</span>
                    </div>
                    <Progress value={progressPct} className="h-2" />
                  </div>
                  {goal.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {goal.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-caption">
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