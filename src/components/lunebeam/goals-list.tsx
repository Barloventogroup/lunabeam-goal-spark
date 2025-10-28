import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from '@/components/ui/drawer';
import { Plus, Calendar, ChevronLeft, ChevronRight, Users, UserCheck } from 'lucide-react';
import { goalsService } from '@/services/goalsService';
import { getDomainDisplayName } from '@/utils/domainUtils';
import type { Goal, GoalStatus } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useGoals } from '@/hooks/useGoals';
import { GoalDetailV2 } from './goal-detail-v2';
interface GoalsListProps {
  onNavigate: (view: string, goalId?: string) => void;
  refreshTrigger?: number;
}
type GoalsTab = 'active' | 'completed';
export const GoalsList: React.FC<GoalsListProps> = ({
  onNavigate,
  refreshTrigger
}) => {
  const [activeTab, setActiveTab] = useState<GoalsTab>('active');
  const [currentPage, setCurrentPage] = useState(1);
  const [filterCreator, setFilterCreator] = useState<string>("all");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const {
    toast
  } = useToast();
  const GOALS_PER_PAGE = 5;

  // Use React Query for goals fetching
  const filters = activeTab === 'completed' ? {
    status: 'completed' as GoalStatus
  } : undefined;
  const {
    data,
    isLoading,
    error,
    refetch
  } = useGoals(filters);
  const goals = data?.goals || [];
  const allProfiles = data?.profiles || {};

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({
      data: {
        user
      }
    }) => setCurrentUser(user));
  }, []);

  // Reset page on tab change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // Refetch on external trigger
  useEffect(() => {
    if (refreshTrigger) refetch();
  }, [refreshTrigger, refetch]);
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'activeGreen';
      case 'completed':
        return 'default';
      case 'paused':
        return 'secondary';
      case 'planned':
        return 'planned';
      default:
        return 'default';
    }
  };
  const handleDeleteGoal = async (goalId: string, goalTitle: string) => {
    try {
      await goalsService.deleteGoal(goalId);
      toast({
        title: 'Goal archived',
        description: `"${goalTitle}" has been moved to your archive`
      });
      refetch();
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

  // Apply filters
  const filteredGoals = goals.filter(goal => {
    if (filterCreator === "me" && goal.created_by !== currentUser?.id) return false;
    if (filterCreator === "others" && goal.created_by === currentUser?.id) return false;
    return true;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredGoals.length / GOALS_PER_PAGE);
  const startIndex = (currentPage - 1) * GOALS_PER_PAGE;
  const endIndex = startIndex + GOALS_PER_PAGE;
  const currentGoals = filteredGoals.slice(startIndex, endIndex);
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const scrollContainer = document.querySelector('[data-scroll-container]');
    if (scrollContainer) {
      scrollContainer.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };
  if (isLoading) {
    return <div className="flex flex-col h-screen bg-background">
        <div className="flex-shrink-0 space-y-4 px-4 pt-6 pb-4 bg-background border-b">
          <div className="flex justify-between items-center">
            <div className="h-8 w-24 bg-muted animate-pulse rounded" />
            <div className="w-10 h-10 bg-muted animate-pulse rounded-full" />
          </div>
          <div className="h-10 bg-muted animate-pulse rounded" />
          <div className="h-10 w-40 bg-muted animate-pulse rounded" />
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Card key={i} className="animate-pulse">
                <CardHeader className="pb-3">
                  <div className="space-y-3">
                    <div className="h-6 bg-muted rounded w-3/4" />
                    <div className="flex gap-2">
                      <div className="h-5 w-20 bg-muted rounded" />
                      <div className="h-5 w-24 bg-muted rounded" />
                    </div>
                  </div>
                </CardHeader>
              </Card>)}
          </div>
        </div>
      </div>;
  }
  return <div className="flex flex-col h-screen bg-background">
      {/* Fixed Header */}
      <div className="flex-shrink-0 space-y-4 px-4 pt-6 pb-4 bg-background border-b border-border shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
        <div className="flex justify-between items-center">
          
        </div>

        <div className="space-y-3">
          <Tabs value={activeTab} onValueChange={value => setActiveTab(value as GoalsTab)} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-2">
            <Select value={filterCreator} onValueChange={setFilterCreator}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by creator" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Goals</SelectItem>
                <SelectItem value="me">Created by me</SelectItem>
                <SelectItem value="others">Created by others</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {totalPages > 1 && <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredGoals.length)} of {filteredGoals.length} goals
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="flex items-center gap-1">
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="flex items-center gap-1">
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>}
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto" data-scroll-container>
        <div className="px-4 py-4">
          {filteredGoals.length === 0 ? <Card>
              <CardContent className="text-center py-8">
                <h3>
                  {activeTab === 'completed' ? 'No completed goals yet' : 'No active goals yet'}
                </h3>
                <p className="text-body-sm text-muted-foreground mb-4">
                  {filteredGoals.length === 0 && goals.length > 0 ? 'No goals match your current filter.' : activeTab === 'completed' ? 'Complete some goals to see them here!' : 'Create your first goal to get started on your journey!'}
                </p>
                {activeTab === 'active' && <div className="space-y-2">
                    <Button onClick={() => onNavigate('create-goal')} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Goal
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Or suggest a goal for someone you support
                    </p>
                  </div>}
              </CardContent>
            </Card> : <div className="space-y-4">
              {currentGoals.map(goal => {
            const isOwnGoal = goal.owner_id === currentUser?.id;
            const isCreatedByMe = goal.created_by === currentUser?.id;
            const ownerName = allProfiles[goal.owner_id]?.first_name || 'Unknown';
            const creatorName = allProfiles[goal.created_by]?.first_name || 'Unknown';
            return <Card key={goal.id} className="cursor-pointer hover:shadow-md transition-shadow relative">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-center">
                        <div className="flex-1 cursor-pointer pr-8" onClick={() => onNavigate('goal-detail', goal.id)}>
                          <h4 className="text-sm mb-2 capitalize">{goal.title}</h4>
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Badge variant={getStatusColor(goal.status)}>
                              {goal.status === 'active' ? 'Active' : goal.status}
                            </Badge>
                            {goal.domain && ['school', 'work', 'health', 'life'].includes(goal.domain) && <Badge variant="category">{getDomainDisplayName(goal.domain)}</Badge>}
                            
                            {!isOwnGoal && <Badge variant="outline" className="text-xs">
                                <Users className="h-3 w-3 mr-1" />
                                For {ownerName}
                              </Badge>}
                            {!isCreatedByMe && isOwnGoal && <Badge variant="outline" className="text-xs">
                                <UserCheck className="h-3 w-3 mr-1" />
                                Created by {creatorName}
                              </Badge>}
                          </div>
                          {goal.due_date && <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              Due {formatDate(goal.due_date)}
                            </div>}
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedGoalId(goal.id);
                            setIsDrawerOpen(true);
                          }}
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-accent rounded-full transition-colors"
                          aria-label="View goal details"
                        >
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </button>
                      </div>
                    </CardHeader>
                  </Card>;
          })}
            </div>}
        </div>
      </div>

      {/* Drawer for Goal Details */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent side="right" className="w-full sm:max-w-2xl">
          <DrawerHeader className="sticky top-0 bg-background z-10 border-b">
            <div className="flex items-center justify-between">
              <DrawerTitle>Goal Details</DrawerTitle>
              <DrawerClose />
            </div>
          </DrawerHeader>
          {selectedGoalId && (
            <GoalDetailV2 
              goalId={selectedGoalId} 
              onBack={() => {
                setIsDrawerOpen(false);
                setSelectedGoalId(null);
              }} 
            />
          )}
        </DrawerContent>
      </Drawer>
    </div>;
};