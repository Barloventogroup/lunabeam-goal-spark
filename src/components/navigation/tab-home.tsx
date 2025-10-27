import React, { useState, useEffect } from 'react';
import { CheckCircle, Plus, Award, ChevronRight, Star, Coins, Target, LogOut } from 'lucide-react';
import { Button } from '../ui/button';

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
import { EveningCatchUpCard } from '../lunebeam/evening-catch-up-card';
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
  onNavigateToGoals: (goalId?: string) => void;
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
  const [stepsData, setStepsData] = useState<{
    todaysSteps: any[];
    overdueSteps: any[];
    upcomingSteps: any[];
  }>({ todaysSteps: [], overdueSteps: [], upcomingSteps: [] });
  const [showCatchUpCard, setShowCatchUpCard] = useState(false);

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

  // Track user activity for catch-up card
  useEffect(() => {
    const updateActivity = () => {
      localStorage.setItem('last_activity_timestamp', Date.now().toString());
    };

    window.addEventListener('click', updateActivity);
    window.addEventListener('scroll', updateActivity);
    window.addEventListener('keydown', updateActivity);

    return () => {
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('scroll', updateActivity);
      window.removeEventListener('keydown', updateActivity);
    };
  }, []);

  // Check catch-up card visibility
  useEffect(() => {
    const checkCatchUpVisibility = async () => {
      if (!user) return;

      const now = new Date();
      const currentHour = now.getHours();
      const catchUpHour = 20; // 8 PM default

      // Only show during catch-up window (8-11 PM)
      if (currentHour < catchUpHour || currentHour >= 23) {
        setShowCatchUpCard(false);
        return;
      }

      // Check if dismissed today
      const dismissedDate = localStorage.getItem('dismissed_catch_up_date');
      const today = now.toISOString().split('T')[0];
      if (dismissedDate === today) {
        setShowCatchUpCard(false);
        return;
      }

      // Check last activity (2+ hours inactive)
      const lastActivity = localStorage.getItem('last_activity_timestamp');
      if (lastActivity) {
        const hoursSinceActivity = (now.getTime() - parseInt(lastActivity)) / (1000 * 60 * 60);
        if (hoursSinceActivity < 2) {
          setShowCatchUpCard(false);
          return;
        }
      }

      // Fetch missed steps
      const { checkInService } = await import('@/services/checkInService');
      const steps = await checkInService.getMissedSteps(user.id);
      setShowCatchUpCard(steps.length >= 2);
    };

    if (profileLoaded) {
      checkCatchUpVisibility();
    }
  }, [profileLoaded, profile, user]);

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
    goals.forEach(goal => {
      if (goal.status === 'active' || goal.status === 'planned') {
        loadSteps(goal.id);
      }
    });
  }, [goalsLoaded, goals, loadSteps]);

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

  // Active goals from store
  const activeGoals = goals.filter(goal => goal.status === 'active' || goal.status === 'planned');
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
    for (const goal of goals) {
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
        const { data: allSubsteps, error } = await supabase
          .from('substeps')
          .select('*')
          .in('step_id', allStepIds);
        
        if (error) {
          console.warn('[TabHome] Error fetching substeps:', error);
        } else {
          // Group substeps by step_id
          (allSubsteps || []).forEach(substep => {
            if (!substepsByStepId[substep.step_id]) {
              substepsByStepId[substep.step_id] = [];
            }
            substepsByStepId[substep.step_id].push(substep);
          });
        }
      } catch (e) {
        console.warn('[TabHome] Failed to batch fetch substeps:', e);
      }
    }

    for (const goal of goals) {
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
      try {
        const data = await getTodaysStepsAndNext();
        setStepsData(data);
      } catch (err) {
        console.error('[TabHome] Failed to compute steps data:', err);
        setStepsData({ todaysSteps: [], overdueSteps: [], upcomingSteps: [] });
      }
    };
    
    if (goalsLoaded) {
      loadStepsData();
    }
  }, [goalsLoaded, goals, steps]);

  const { todaysSteps, overdueSteps, upcomingSteps } = stepsData;
  const todaysDueItem = todaysSteps[0] || null;
  
  console.log('TabHome debug:', { 
    goalsCount: goals.length, 
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

  const handleViewStep = () => {
    if (todaysDueItem) {
      onNavigateToGoals(todaysDueItem.goal.id);
    }
  };

  const handleViewUpcomingStep = (stepId: string, goalId: string) => {
    onNavigateToGoals(goalId);
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
          <div>
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

          {/* First Time User Reminder */}
          {isFirstTime && (
            <FirstTimeReminder onNavigateToGoals={() => setCurrentView('add-goal')} />
          )}

          {/* Evening Catch-Up Card */}
          {showCatchUpCard && user && (
            <EveningCatchUpCard
              userId={user.id}
              onAllComplete={() => {
                toast({ title: 'Great job catching up!' });
                loadPoints();
                refetchGoals();
              }}
              onDismiss={() => setShowCatchUpCard(false)}
            />
          )}

          {/* Today's Focus Card - Always show */}
          <TodaysFocusCard
            step={todaysDueItem?.step}
            goal={todaysDueItem?.goal}
            overdueSteps={overdueSteps}
            upcomingSteps={upcomingSteps}
            onViewStep={handleViewStep}
            onNeedHelp={onOpenChat}
            onViewUpcomingStep={handleViewUpcomingStep}
          />



          <Card className="bg-gradient-to-r from-muted/5 to-accent/5 border-muted">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Target className="h-5 w-5" />
                Your Goals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeGoals.length > 0 ? (
                <>
                  {activeGoals.slice(0, 3).map(goal => (
                    <div key={goal.id} className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
                      <div className="flex items-center gap-3 flex-1">
                        <CircularProgress 
                          value={goal.progress_pct || 0} 
                          size={36}
                          strokeWidth={3}
                          color="#2393CC"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium mb-0.5 capitalize">
                            {goal.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {normalizeDomainForDisplay(goal.domain)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="checkin" 
                          onClick={() => {
                            setSelectedGoal(goal);
                            setShowCheckinModal(true);
                          }}
                        >
                          Review
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => onNavigateToGoals(goal.id)}
                          style={{ backgroundColor: '#2393CC', color: 'white' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1e7bb8'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2393CC'}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Show More button when there are more than 3 goals */}
                  {activeGoals.length > 3 && (
                    <div 
                      className="cursor-pointer hover:bg-muted/50 transition-colors border-dashed border p-3 rounded-lg"
                      onClick={() => onNavigateToGoals()}
                    >
                      <div className="flex items-center justify-end text-right w-full">
                        <div className="text-muted-foreground flex items-center gap-2">
                          <p className="text-sm font-medium">
                            More Goals
                          </p>
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No active goals yet</p>
              )}
            </CardContent>
          </Card>


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
    </>;
};
