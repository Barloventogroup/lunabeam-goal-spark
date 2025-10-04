import React, { useState, useEffect } from 'react';
import { CheckCircle, Plus, Award, ChevronRight, Star, Coins, Target, LogOut } from 'lucide-react';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
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
import { useStore } from '../../store/useStore';
import { supabase } from '../../integrations/supabase/client';
import { useAuth } from '../auth/auth-provider';
import { goalsService, stepsService } from '../../services/goalsService';
import { normalizeDomainForDisplay } from '../../utils/domainUtils';
import { getWelcomeMessage } from '../../utils/userTypeUtils';
import type { Goal } from '../../types';

interface TabHomeProps {
  onOpenChat: () => void;
  onNavigateToGoals: (goalId?: string) => void;
  onNavigateToNotifications: () => void;
}

type HomeView = 'dashboard' | 'rewards' | 'checkin' | 'add-goal' | 'reward-bank';

export const TabHome: React.FC<TabHomeProps> = ({
  onOpenChat,
  onNavigateToGoals,
  onNavigateToNotifications
}) => {
  const [currentView, setCurrentView] = useState<HomeView>('dashboard');
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [goalsLoaded, setGoalsLoaded] = useState(false);

  const { user, signOut } = useAuth();
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

  // Add effect to listen for tab visibility changes and refresh data
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('TabHome: Tab became visible, refreshing data');
        loadGoals();
        loadPoints();
        // Refresh steps for active goals
        goals.forEach(goal => {
          if (goal.status === 'active' || goal.status === 'planned') {
            loadSteps(goal.id);
          }
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [loadGoals, loadPoints, loadSteps, goals]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      console.log('TabHome mounted - loading data');
      await Promise.allSettled([loadProfile(), loadGoals(), loadPoints()]);
      if (!isMounted) return;
      setProfileLoaded(true);
      setGoalsLoaded(true);
      // Steps will be loaded once goals are available in a separate effect
    })();
    return () => { isMounted = false; };
  }, [loadProfile, loadGoals, loadPoints]);

  // After goals load, fetch steps for active/planned goals to avoid UI flash and ensure freshness
  useEffect(() => {
    if (!goalsLoaded) return;
    goals.forEach(goal => {
      if (goal.status === 'active' || goal.status === 'planned') {
        loadSteps(goal.id);
      }
    });
  }, [goalsLoaded, goals, loadSteps]);

  // Refresh data when component becomes visible
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('TabHome: Periodic refresh');
      loadGoals();
      loadPoints();
      // Also refresh steps for active goals
      goals.forEach(goal => {
        if (goal.status === 'active' || goal.status === 'planned') {
          loadSteps(goal.id);
        }
      });
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [loadGoals, loadSteps, goals]);

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
  const isFirstTime = goalsLoaded && activeGoals.length === 0;
  
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
  const getTodaysStepsAndNext = () => {
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

    goals.forEach((goal) => {
      // Include active/planned/paused goals
      if (goal.status === 'active' || goal.status === 'planned' || goal.status === 'paused') {
        const goalSteps = steps[goal.id] || [];
        goalSteps.forEach((step) => {
          allStepsDebug.push({
            goalTitle: goal.title,
            goalStatus: goal.status,
            stepTitle: step.title,
            stepStatus: step.status,
            dueDate: step.due_date
          });

          // Exclude completed or skipped steps; include others with a due date
          if (step.status !== 'done' && step.status !== 'skipped') {
            const dueDate = normalizeDueDate(step.due_date);
            if (dueDate && !isNaN(dueDate.getTime())) {
              const dueDateStart = new Date(dueDate);
              dueDateStart.setHours(0, 0, 0, 0);
              
              if (isToday(dueDate)) {
                todaysSteps.push({ step, goal });
              } else if (dueDateStart < today) {
                // Overdue steps
                overdueSteps.push({ step, goal, dueDate });
              } else {
                // Future steps
                upcomingSteps.push({ step, goal, dueDate });
              }
            }
          }
        });
      }
    });

    console.log('All steps debug:', allStepsDebug);
    overdueSteps.sort((a, b) => b.dueDate.getTime() - a.dueDate.getTime()); // Most recent overdue first
    upcomingSteps.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
    return { 
      todaysSteps, 
      overdueSteps: overdueSteps.slice(0, 3),
      upcomingSteps: upcomingSteps.slice(0, 3) 
    };
  };

  const { todaysSteps, overdueSteps, upcomingSteps } = getTodaysStepsAndNext();
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
      <div className="min-h-screen bg-gradient-soft">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-card/80 backdrop-blur">
          <div className="flex items-center">
            <img src="/lovable-uploads/7f6e5283-da38-4bfc-ac26-ae239e843b39.png" alt="Lunabeam logo" className="h-10 w-auto object-cover object-center" style={{
            objectPosition: 'center'
          }} />
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
            
            {/* User Avatar */}
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-blue-500 text-white text-sm font-medium">
                {profile?.first_name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            
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
              const isFirstTime = activeGoals.length === 0;
              const isAdmin = userContext?.userType === 'admin';
              
              let title, subtitle;
              
              if (isAdmin) {
                // Admin experience
                title = "Welcome! 💜";
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
