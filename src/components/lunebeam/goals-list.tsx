import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Calendar, Target, Flag, MoreVertical, Trash2, CheckCircle2, UserPlus, Share2, ChevronLeft, ChevronRight } from 'lucide-react';
import { goalsService, stepsService } from '@/services/goalsService';
import type { Goal, Step } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface GoalsListProps {
  onNavigate: (view: string, goalId?: string) => void;
  refreshTrigger?: number; // Optional prop to trigger refresh
}

type GoalsTab = 'active' | 'completed';

export const GoalsList: React.FC<GoalsListProps> = ({ onNavigate, refreshTrigger }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [stepsCount, setStepsCount] = useState<Record<string, { required: number; done: number }>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<GoalsTab>('active');
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  const GOALS_PER_PAGE = 10;

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
        try {
          const steps = await stepsService.getSteps(goal.id);
          // Use same logic as goal detail view - actionable steps include new schema too
          const actionableSteps = steps.filter(s => ((!s.type || s.type === 'action') || (s.step_type && s.step_type !== 'container')) && !s.hidden && s.status !== 'skipped');
          const doneSteps = actionableSteps.filter(s => s.status === 'done');
          counts[goal.id] = {
            required: actionableSteps.length,
            done: doneSteps.length
          };
        } catch (error) {
          console.error(`Failed to load steps for goal ${goal.id}:`, error);
          counts[goal.id] = { required: 0, done: 0 };
        }
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
    // Reset to first page when tab changes
    setCurrentPage(1);
    // Force sanitization of existing descriptions - remove the localStorage check
    goalsService.sanitizeExistingGoalDescriptions().then(() => {
      // Reload goals after sanitization to show updated descriptions
      loadGoals();
    });
  }, [activeTab, refreshTrigger]); // Reload when tab changes or refresh is triggered

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
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDomainDisplayName = (domain: string): string => {
    const domainMap: Record<string, string> = {
      'school': 'Education - High School / Academic Readiness',
      'work': 'Employment',
      'health': 'Health & Well-Being',
      'life': 'Life Skills'
    };
    return domainMap[domain] || domain;
  };

  const sanitizeDescription = (text?: string): string => {
    if (!text) return '';
    let out = text.trim();
    
    // Fix frequency patterns
    out = out.replace(/(\d+)x\/week/gi, '$1 times per week');
    out = out.replace(/Daily for (\d+) times per week/gi, '$1 times per week');
    out = out.replace(/Daily for (\d+)x\/week/gi, '$1 times per week');
    
    // Fix double parentheses and nested structures
    out = out.replace(/\(\s*\([^)]+\)\s*\)/g, (match) => {
      const inner = match.replace(/^\(\s*\(/, '(').replace(/\)\s*\)$/, ')');
      return inner;
    });
    
    // Remove outer parentheses around trailing "with ..." clauses
    out = out.replace(/\.?\s*\((with [^)]+)\)\s*$/i, '. $1');
    
    // Fix awkward "to relax/enjoy" patterns
    out = out.replace(/to relax\/enjoy/gi, 'to relax and enjoy');
    
    // Fix standalone "with" clauses at the end
    out = out.replace(/\.\s*with\s+([A-Z])/g, ' with $1');
    
    // Fix double spaces and ensure proper spacing
    out = out.replace(/\s{2,}/g, ' ');
    out = out.replace(/\s*\.\s*\./g, '.');
    
    // Ensure single ending period
    out = out.replace(/\.+\s*$/, '.');
    
    return out;
  };

  // Calculate pagination
  const totalPages = Math.ceil(goals.length / GOALS_PER_PAGE);
  const startIndex = (currentPage - 1) * GOALS_PER_PAGE;
  const endIndex = startIndex + GOALS_PER_PAGE;
  const currentGoals = goals.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return null; // Don't show loading state
  }

  return (
    <div className="space-y-4 px-4 pt-6">
      <div className="flex justify-between items-center">
        <h2>
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

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as GoalsTab)} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="mt-4">
          {goals.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
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
            <>
              <div className="space-y-4">
                {currentGoals.map((goal) => {
                  const stepCount = stepsCount[goal.id] || { required: goal.progress?.actionable || 0, done: goal.progress?.done || 0 };
                  const progressPct = goal.progress_pct || (goal.progress ? goal.progress.percent : 0);

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
                                {goal.status === 'active' ? 'In Progress' : goal.status}
                              </Badge>
                              {goal.domain && (
                                <Badge variant="category">{getDomainDisplayName(goal.domain)}</Badge>
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
                                  className="h-8 w-8 p-0 bg-transparent hover:bg-gray-100"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40 bg-background border shadow-lg z-50">
                                <DropdownMenuItem onClick={() => {/* TODO: Open check-in modal */}}>
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Check In
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {/* TODO: Add buddy functionality */}}>
                                  <UserPlus className="h-4 w-4 mr-2" />
                                  Add Buddy
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {/* TODO: Share functionality */}}>
                                  <Share2 className="h-4 w-4 mr-2" />
                                  Share
                                </DropdownMenuItem>
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
                            {sanitizeDescription(goal.description)}
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

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 px-2">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1}-{Math.min(endIndex, goals.length)} of {goals.length} goals
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                          className="w-8 h-8 p-0"
                        >
                          {page}
                        </Button>
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-1"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};