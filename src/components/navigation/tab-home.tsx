import React, { useState, useEffect } from 'react';
import { CheckCircle, Plus, Award, ChevronRight, Star, Coins, Target, LogOut, AlertCircle, Clock, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from '../ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { CircularProgress } from '../ui/circular-progress';

import { parseISO, isToday } from 'date-fns';

import { RewardsScreen } from '../lunebeam/rewards-screen';
import { RewardsGallery } from '../lunebeam/reward-bank';
import { WeeklyCheckinModal } from '../lunebeam/weekly-checkin-modal';
import { RedesignedGoalsWizard } from '../lunebeam/redesigned-goals-wizard';
import { NotificationBadge } from '../lunebeam/notification-badge';
import { PointsDisplay } from '../lunebeam/points-display';
import { FirstTimeReminder } from '../lunebeam/first-time-reminder';
import { TodaysFocusCard } from '../lunebeam/todays-focus-card';
import { RecommendedStepsList } from '../lunebeam/recommended-steps-list';
import { useStore } from '../../store/useStore';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '../../integrations/supabase/client';
import { useAuth } from '../auth/auth-provider';
import { goalsService, stepsService } from '../../services/goalsService';
import { useGoals } from '@/hooks/useGoals';
import { pointsService } from '../../services/pointsService';
import { normalizeDomainForDisplay } from '../../utils/domainUtils';
import { getWelcomeMessage } from '../../utils/userTypeUtils';
import type { Goal } from '../../types';
import type { EntryVariant } from '@/utils/entryExperience';

interface TabHomeProps {
  entryVariant?: EntryVariant;
  onOpenChat: () => void;
  onNavigateToGoals: (goalId?: string, stepId?: string) => void;
  onNavigateToNotifications: () => void;
}

type HomeView = 'dashboard' | 'rewards' | 'checkin' | 'add-goal' | 'reward-bank';

export const TabHome: React.FC<TabHomeProps> = ({
  entryVariant = 'returning',
  onOpenChat,
  onNavigateToGoals,
  onNavigateToNotifications
}) => {
  const [currentView, setCurrentView] = useState<HomeView>('dashboard');
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [goalsLoaded, setGoalsLoaded] = useState(false);
  const [showMissedStepsCard, setShowMissedStepsCard] = useState(true);
  const [stepsData, setStepsData] = useState<{
    todaysSteps: any[];
    overdueSteps: any[];
    upcomingSteps: any[];
  }>({ todaysSteps: [], overdueSteps: [], upcomingSteps: [] });
  const [isLoadingSteps, setIsLoadingSteps] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerGoalId, setDrawerGoalId] = useState<string | null>(null);
  const [drawerStepId, setDrawerStepId] = useState<string | null>(null);

  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const {
    profile,
    userContext,
    loadProfile,
    goals,
    steps,
    pointsSummary,
    loadGoals,
    loadPoints,
    loadSteps
  } = useStore();

  // Use React Query for goals
  const { data: goalsData, isLoading: goalsLoading, refetch: refetchGoals } = useGoals();
  const goalsFromQuery = goalsData?.goals || [];

  // Add effect to listen for tab visibility changes and refresh data
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('TabHome: Tab visible, React Query will refetch based on config');
        // React Query handles refetch automatically via refetchOnWindowFocus
        refetchGoals(); // Manual trigger is fine - React Query manages it
        loadPoints(); // Keep this - not managed by React Query
        // Remove aggressive steps loading - they load when needed
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refetchGoals, loadPoints]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      console.log('TabHome mounted - loading essential data only');
      // Remove loadGoals() - React Query already handles this via useGoals hook
      await Promise.allSettled([loadProfile(), loadPoints()]);
      if (!isMounted) return;
      setProfileLoaded(true);
      setGoalsLoaded(!goalsLoading);
      
      // Steps will be loaded once goals are available in a separate effect
    })();
    return () => { isMounted = false; };
  }, [loadProfile, loadPoints, goalsLoading]);

  // Sync React Query goals with Zustand store
  useEffect(() => {
    if (!goalsLoading && goalsFromQuery.length > 0) {
      setGoalsLoaded(true);
    }
  }, [goalsLoading, goalsFromQuery]);

  // After goals load, fetch steps for active/planned goals to avoid UI flash and ensure freshness
  useEffect(() => {
    if (!goalsLoaded) return;
    goalsFromQuery.forEach(goal => {
      if (goal.status === 'active' || goal.status === 'planned') {
        loadSteps(goal.id);
      }
    });
  }, [goalsLoaded, goalsFromQuery, loadSteps]);

  if (currentView === 'rewards') {
    return <RewardsScreen onBack={() => setCurrentView('dashboard')} />;
  }
  if (currentView === 'reward-bank') {
    return <RewardsGallery onBack={() => setCurrentView('dashboard')} />;
  }
  if (currentView === 'add-goal') {
    return <RedesignedGoalsWizard 
      onComplete={() => setCurrentView('dashboard')} 
      onCancel={() => setCurrentView('dashboard')} 
      isSupporter={userContext?.userType === 'supporter' || userContext?.userType === 'hybrid'}
    />;
  }

  // Active goals from React Query
  const activeGoals = goalsFromQuery.filter(goal => goal.status === 'active' || goal.status === 'planned');
  // Trust the entryVariant prop - it knows the correct experience
  const isFirstTime = entryVariant === 'first_time';
  
  // Determine the correct name to display in greeting (synchronously to avoid flash)
  const getDisplayName = () => {
    // If user has first_name in metadata, use it (admin's name)
    if (user?.user_metadata?.first_name) {
      const adminName = user.user_metadata.first_name.toString().trim();
      return adminName.charAt(0).toUpperCase() + adminName.slice(1);
    }
    // Fallback to profile name (individual's name)
    if (profile?.first_name) {
      return profile.first_name.charAt(0).toUpperCase() + profile.first_name.slice(1);
    }
    return 'there';
  };
  
  const displayName = getDisplayName();
  const mockPoints = 247; // Placeholder points to match Rewards screen

  // Compute today's due step, overdue steps and next upcoming steps
  const getTodaysStepsAndNext = async () => {
    const todaysSteps: Array<{ step: any; goal: Goal }> = [];
    const overdueSteps: Array<{ step: any; goal: Goal; dueDate: Date }> = [];
    const upcomingSteps: Array<{ step: any; goal: Goal; dueDate: Date }> = [];
    const allStepsDebug: Array<{ goalTitle: string; goalStatus: string; stepTitle: string; stepStatus: string; dueDate: any }> = [];

    const normalizeDueDate = (raw: any): Date | null => {
      if (!raw) return null;
      try {
        if (raw instanceof Date) return raw as Date;
        if (typeof raw === 'string') return parseISO(raw as string);
        const d = new Date(raw);
        return d;
      } catch {
        return null;
      }
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    // Batch fetch all substeps in a single query (fixes N+1 query problem)
    const allStepIds: string[] = [];
    for (const goal of goalsFromQuery) {
      if (goal.status === 'active' || goal.status === 'planned' || goal.status === 'paused') {
        const goalSteps = steps[goal.id] || [];
        goalSteps.forEach(step => {
          if (step?.id && typeof step.id === 'string' && step.status !== 'done' && step.status !== 'skipped') {
            allStepIds.push(step.id);
          }
        });
      }
    }

    // Fetch all substeps in one query
    let substepsByStepId: Record<string, any[]> = {};
    if (allStepIds.length > 0) {
      try {
        const { data: allScaffoldingSteps, error } = await supabase
          .from('steps')
          .select('*')
          .in('parent_step_id', allStepIds)
          .eq('is_scaffolding', true);
        
        if (error) {
          console.warn('[TabHome] Error fetching scaffolding steps:', error);
        } else {
          // Group scaffolding steps by parent_step_id
          (allScaffoldingSteps || []).forEach(scaffoldingStep => {
            const parentId = scaffoldingStep.parent_step_id;
            if (!parentId) return;
            if (!substepsByStepId[parentId]) {
              substepsByStepId[parentId] = [];
            }
            // Map to legacy format
            substepsByStepId[parentId].push({
              id: scaffoldingStep.id,
              step_id: parentId,
              completed_at: scaffoldingStep.status === 'done' ? scaffoldingStep.updated_at : undefined
            });
          });
        }
      } catch (e) {
        console.warn('[TabHome] Failed to batch fetch scaffolding steps:', e);
      }
    }

    for (const goal of goalsFromQuery) {
      // Include active/planned/paused goals
      if (goal.status === 'active' || goal.status === 'planned' || goal.status === 'paused') {
        const goalSteps = steps[goal.id] || [];
        
        for (const step of goalSteps) {
          allStepsDebug.push({
            goalTitle: goal.title,
            goalStatus: goal.status,
            stepTitle: step.title,
            stepStatus: step.status,
            dueDate: step.due_date
          });

          // Exclude completed or skipped steps; include others with a due date
          if (step.status !== 'done' && step.status !== 'skipped') {
            // Get pre-fetched substeps (already batched)
            const substeps = substepsByStepId[step.id] || [];
            const incompleteSubsteps = substeps.filter(sub => !sub.completed_at);
            
            if (incompleteSubsteps.length > 0) {
              // Count each incomplete substep separately
              incompleteSubsteps.forEach(substep => {
                const dueDate = normalizeDueDate(step.due_date); // Use parent step's due date
                if (dueDate && !isNaN(dueDate.getTime())) {
                  const dueDateStart = new Date(dueDate);
                  dueDateStart.setHours(0, 0, 0, 0);
                  
                  // Create a virtual "step" for the substep to maintain compatibility
                  const substepAsStep = {
                    ...step,
                    id: substep.id,
                    title: `→ ${substep.title}`,
                    isSubstep: true,
                    parentStepId: step.id
                  };
                  
                  if (isToday(dueDate)) {
                    todaysSteps.push({ step: substepAsStep, goal });
                  } else if (dueDateStart < today) {
                    overdueSteps.push({ step: substepAsStep, goal, dueDate });
                  } else {
                    upcomingSteps.push({ step: substepAsStep, goal, dueDate });
                  }
                }
              });
            } else {
              // No substeps or all complete - count the main step
              const dueDate = normalizeDueDate(step.due_date);
              if (dueDate && !isNaN(dueDate.getTime())) {
                const dueDateStart = new Date(dueDate);
                dueDateStart.setHours(0, 0, 0, 0);
                
                if (isToday(dueDate)) {
                  todaysSteps.push({ step, goal });
                } else if (dueDateStart < today) {
                  overdueSteps.push({ step, goal, dueDate });
                } else {
                  upcomingSteps.push({ step, goal, dueDate });
                }
              }
            }
          }
        }
      }
    }

    const sample = allStepsDebug.slice(0, 5);
    console.log(`All steps debug (sample size=${sample.length} of ${allStepsDebug.length}):`, sample);
    overdueSteps.sort((a, b) => b.dueDate.getTime() - a.dueDate.getTime());
    upcomingSteps.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
    return { 
      todaysSteps, 
      overdueSteps: overdueSteps.slice(0, 3),
      upcomingSteps: upcomingSteps.slice(0, 3) 
    };
  };

  // Load steps data when goals change
  useEffect(() => {
    const loadStepsData = async () => {
      setIsLoadingSteps(true);
      try {
        const data = await getTodaysStepsAndNext();
        setStepsData(data);
      } catch (err) {
        console.error('[TabHome] Failed to compute steps data:', err);
        setStepsData({ todaysSteps: [], overdueSteps: [], upcomingSteps: [] });
      } finally {
        setIsLoadingSteps(false);
      }
    };
    
    // Only compute when we have goals loaded and at least attempted to load steps
    if (!goalsLoading && goalsFromQuery.length > 0) {
      loadStepsData();
    } else if (!goalsLoading) {
      // No goals at all - set loading to false
      setIsLoadingSteps(false);
    }
  }, [goalsLoading, goalsFromQuery, steps]);

  const { todaysSteps, overdueSteps, upcomingSteps } = stepsData;
  const todaysDueItem = todaysSteps[0] || null;
  
  console.log('TabHome debug:', { 
    goalsCount: goalsFromQuery.length,
    stepsCount: Object.keys(steps).length,
    todaysStepsCount: todaysSteps.length,
    overdueStepsCount: overdueSteps.length,
    upcomingStepsCount: upcomingSteps.length,
    overdueSteps: overdueSteps.map(item => ({
      stepTitle: item.step.title,
      stepStatus: item.step.status,
      dueDate: item.step.due_date,
      goalTitle: item.goal.title,
      goalStatus: item.goal.status
    })),
    upcomingSteps: upcomingSteps.map(item => ({
      stepTitle: item.step.title,
      stepStatus: item.step.status,
      dueDate: item.step.due_date,
      goalTitle: item.goal.title,
      goalStatus: item.goal.status
    }))
  });

  const handleViewStep = (stepId: string, goalId: string) => {
    setDrawerGoalId(goalId);
    setDrawerStepId(stepId);
    setDrawerOpen(true);
  };

  const handleViewUpcomingStep = (stepId: string, goalId: string) => {
    setDrawerGoalId(goalId);
    setDrawerStepId(stepId);
    setDrawerOpen(true);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = '/auth';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return <>
      <div className="min-h-[100dvh] bg-gradient-soft pt-safe-content">
        {/* Header */}
      <div className="fixed left-0 right-0 top-safe z-40 flex items-center justify-between px-4 pb-4 pt-4 bg-card/80 backdrop-blur border-b border-gray-200">
          <div className="flex items-center">
            <img src="/lovable-uploads/7f6e5283-da38-4bfc-ac26-ae239e843b39.png" alt="Lunabeam logo" className="h-7 w-auto object-contain" />
          </div>
          
          <div className="flex items-center gap-3">
            {/* Notification Badge */}
            <NotificationBadge 
              onNavigateToNotifications={onNavigateToNotifications}
            />
            
            {/* LunaPoints Display */}
            <div 
              className="flex items-center gap-1 bg-muted px-3 py-1.5 rounded-full cursor-pointer hover:bg-muted/80 transition-colors"
              onClick={() => setCurrentView('rewards')}
            >
              <Coins className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium">{pointsSummary?.totalPoints || 0}</span>
            </div>
            
            {/* Sign Out Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Welcome Message */}
          <div className="pt-4">
            {(() => {
              const isAdmin = userContext?.userType === 'admin';
              
              let title, subtitle;
              
              if (isAdmin) {
                // Admin experience
                title = "Welcome!";
                subtitle = isFirstTime
                  ? "You've created this account to support someone important in your life. As the Admin, you can help set goals, follow progress, and invite others such as friends, providers, or coaches to be part of the team.\n\nThis space is here to make collaboration easy and encouraging. Together we'll turn small steps into big milestones.\n\n✨ Let's get started by setting up the first goal."
                  : `Welcome back, ${displayName}! Ready to continue supporting your team and tracking progress together.`;
              } else if (userContext?.userType === 'individual') {
                // Individual experience
                title = `Welcome, ${displayName}!`;
                subtitle = isFirstTime 
                  ? "Your support team has set up your goals. Let's continue your journey together!"
                  : "Ready to continue working on your goals? Your support team is here to help.";
              } else {
                // Fallback for unknown user types
                title = isFirstTime ? `Welcome ${displayName}!` : `Welcome back, ${displayName}!`;
                subtitle = isFirstTime
                  ? "👋 Hey there! Welcome aboard. Let's kick things off by setting your very first goal. Ready to get started?"
                  : "Let's keep moving forward, one step at a time.";
              }
              
              return (
                <>
                  <h2 className="text-2xl font-bold mb-1">
                    {title}
                  </h2>
                  <p className="text-muted-foreground whitespace-pre-line">
                    {subtitle}
                  </p>
                </>
              );
            })()}
          </div>

          {/* Missed Steps Alert Card */}
          {overdueSteps.length > 0 && showMissedStepsCard && (
            <Card className="relative bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-950/30 border-2 border-red-400 dark:border-red-700 animate-pulse">
              <CardContent className="py-4 pr-12">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-200 dark:hover:bg-red-900/50"
                  onClick={() => setShowMissedStepsCard(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-base text-foreground">Review your missed steps</h3>
                    <p className="text-sm text-muted-foreground">
                      You have {overdueSteps.length} step{overdueSteps.length !== 1 ? 's' : ''} that need attention
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* First Time User Reminder */}
          {isFirstTime && (
            <FirstTimeReminder onNavigateToGoals={() => setCurrentView('add-goal')} />
          )}

          {/* Today's Focus Card - Always show */}
          {isLoadingSteps ? (
            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Today's Focus
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <TodaysFocusCard
              step={todaysDueItem?.step}
              goal={todaysDueItem?.goal}
              overdueSteps={overdueSteps}
              upcomingSteps={upcomingSteps}
              onViewStep={handleViewStep}
              onNeedHelp={onOpenChat}
              onViewUpcomingStep={handleViewUpcomingStep}
            />
          )}


        </div>
      </div>

      {/* Check-in Modal */}
      {selectedGoal && (
        <WeeklyCheckinModal 
          isOpen={showCheckinModal} 
          onOpenChange={setShowCheckinModal} 
          goal={selectedGoal}
          weekOf={new Date().toISOString().split('T')[0]} 
        />
      )}

      {/* Step Detail Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="right">
          <SheetHeader className="border-b pb-4">
            <SheetTitle>Recommended Steps</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-4">
            {drawerGoalId && (() => {
              const goal = goalsFromQuery.find(g => g.id === drawerGoalId);
              const goalSteps = steps[drawerGoalId] || [];
              
              if (!goal) return <p className="text-muted-foreground">Goal not found</p>;
              
              return (
                <RecommendedStepsList
                  steps={goalSteps}
                  goal={goal}
                  onStepsChange={() => {
                    loadSteps(drawerGoalId);
                  }}
                />
              );
            })()}
          </div>
        </SheetContent>
      </Sheet>
    </>;
};
