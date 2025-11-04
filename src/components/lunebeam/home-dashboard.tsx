import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { ProgressRing } from '@/components/ui/progress-ring';
import { 
  Target, 
  Calendar, 
  Award, 
  Users, 
  Camera, 
  User,
  Plus,
  CheckCircle2,
  Clock,
  Sparkles,
  LogOut,
  MessageCircle,
  ChevronRight,
  Trophy,
  Star,
  Coins,
  UserCheck
} from 'lucide-react';
import { AIChat } from './ai-chat';
import { FamilyCircleCard } from './family-circle-card';
import { PersonalizedGreeting } from './personalized-greeting';
import { NotificationSystem } from './notification-system';
import { StepsList } from './steps-list';
import { StepsChat } from './steps-chat';
import { ProgressBar } from './progress-bar';
import { TodaysFocusCard } from './todays-focus-card';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/components/auth/auth-provider';
import { getSupporterContext } from '@/utils/supporterUtils';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays, isToday, parseISO } from 'date-fns';
import type { Goal } from '@/types';
import { getWelcomeMessage } from '@/utils/userTypeUtils';

interface HomeDashboardProps {
  onNavigate: (view: string, data?: any) => void;
}

const HomeDashboard: React.FC<HomeDashboardProps> = ({ onNavigate }) => {
  const { 
    profile, 
    userContext,
    goals,
    steps,
    getActiveGoal, 
    getRecentCheckIns, 
    evidence,
    familyCircles,
    justCompletedOnboarding,
    pointsSummary,
    loadProfile,
    loadGoals,
    loadSteps,
    loadCheckIns,
    loadEvidence,
    loadFamilyCircles,
    loadPoints,
    clearJustCompletedOnboarding,
    createFamilyCircle,
    updateUserContext
  } = useStore();
  
  const { user, signOut } = useAuth();
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [supporterContext, setSupporterContext] = useState<any>(null);

  // Get supporter context for supporters
  useEffect(() => {
    if (userContext?.userType === 'supporter') {
      const getCurrentUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          getSupporterContext(user.id).then(setSupporterContext);
        }
      };
      getCurrentUser();
    }
  }, [userContext]);

  useEffect(() => {
    if (user) {
      console.log('Loading data for user:', user.id);
      loadProfile();
      loadGoals();
      loadCheckIns();
      loadEvidence();
      loadFamilyCircles();
      loadPoints();
      updateUserContext(); // Ensure user context is loaded
    }
  }, [user, loadProfile, loadGoals, loadCheckIns, loadEvidence, loadFamilyCircles, loadPoints, updateUserContext]);

  // Fetch profiles for goal owners and creators
  useEffect(() => {
    const fetchProfiles = async () => {
      if (goals.length === 0) return;
      
      const userIds = new Set<string>();
      goals.forEach(goal => {
        if (goal.owner_id) userIds.add(goal.owner_id);
        if (goal.created_by) userIds.add(goal.created_by);
      });
      
      if (userIds.size > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, first_name')
          .in('user_id', Array.from(userIds));
        
        if (profilesData) {
          const profilesLookup: Record<string, any> = {};
          profilesData.forEach(profile => {
            profilesLookup[profile.user_id] = profile;
          });
          setProfiles(profilesLookup);
        }
      }
    };
    
    fetchProfiles();
  }, [goals]);

  // Add refresh data when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        console.log('Tab became visible - refreshing goals data');
        loadGoals();
        loadPoints(); // Also refresh points when tab becomes visible
      }
    };

    // Listen for immediate points updates from step completions
    const handlePointsUpdated = () => {
      console.log('Dashboard: Points updated event received, refreshing...');
      loadPoints();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pointsUpdated', handlePointsUpdated);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pointsUpdated', handlePointsUpdated);
    };
  }, [user, loadGoals, loadPoints]);

  const activeGoal = getActiveGoal();
  const activeGoalSteps = activeGoal ? steps[activeGoal.id] || [] : [];

  useEffect(() => {
    // Load steps for active goal when it changes
    if (activeGoal) {
      loadSteps(activeGoal.id);
    }
  }, [activeGoal?.id, loadSteps]);

  // Auto-refresh steps when AI enhancement completes
  useEffect(() => {
    if (!activeGoal?.id) return;

    const channel = supabase
      .channel(`steps-dashboard-${activeGoal.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'steps',
        filter: `goal_id=eq.${activeGoal.id}`
      }, (payload) => {
        console.log('[HomeDashboard] Steps updated, reloading...', payload);
        loadSteps(activeGoal.id);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeGoal?.id, loadSteps]);
  const recentCheckIns = activeGoal ? getRecentCheckIns(activeGoal.id) : [];

  // Calculate stats
  const completedGoals = goals.filter(goal => goal.status === 'completed');
  const archivedGoals = goals.filter(goal => goal.status === 'archived');
  const allCompletedAndArchived = [...completedGoals, ...archivedGoals];
  const totalPoints = pointsSummary?.totalPoints || 0;

  // Calculate progress
  const getGoalProgress = () => {
    if (!activeGoal || recentCheckIns.length === 0) return 0;
    
    const targetAttempts = 3; // From success_criteria
    const totalAttempts = recentCheckIns.reduce((sum, checkIn) => sum + checkIn.count_of_attempts, 0);
    return Math.min((totalAttempts / targetAttempts) * 100, 100);
  };

  const getNextCheckInDate = () => {
    if (!activeGoal) return null;
    
    const lastCheckIn = recentCheckIns[0];
    if (!lastCheckIn) return new Date();
    
    const lastDate = new Date(lastCheckIn.date);
    
    // Simplified schedule until new check-in settings exist
    return addDays(lastDate, 1);
  };

  const nextCheckIn = getNextCheckInDate();
  const isCheckInDue = nextCheckIn ? isToday(nextCheckIn) || nextCheckIn < new Date() : true;
  
  // Find today's due step and next upcoming steps
  const getTodaysStepsAndNext = () => {
    const todaysSteps: Array<{step: any, goal: Goal}> = [];
    const upcomingSteps: Array<{step: any, goal: Goal, dueDate: Date}> = [];
    
    goals.forEach(goal => {
      if (goal.status === 'active' || goal.status === 'planned') {
        const goalSteps = steps[goal.id] || [];
        goalSteps.forEach(step => {
          if (step.due_date && step.status === 'not_started') {
            try {
              const dueDate = parseISO(step.due_date);
              if (isToday(dueDate)) {
                todaysSteps.push({ step, goal });
              } else if (dueDate > new Date()) {
                upcomingSteps.push({ step, goal, dueDate });
              }
            } catch (error) {
              console.warn('Invalid due_date format for step:', step.id, step.due_date);
            }
          }
        });
      }
    });
    
    // Sort upcoming steps by due date
    upcomingSteps.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
    
    return {
      todaysSteps,
      upcomingSteps: upcomingSteps.slice(0, 3) // Show up to 3 upcoming steps
    };
  };

  const { todaysSteps, upcomingSteps } = getTodaysStepsAndNext();
  const todaysDueItem = todaysSteps[0] || null;
  
  const hasActiveOrPlannedGoals = goals.some(goal => goal.status === 'active' || goal.status === 'planned');
  const isFirstTimeUser = justCompletedOnboarding && !hasActiveOrPlannedGoals;
  const hasProgressToShow = activeGoal && ((activeGoal.progress_pct || 0) > 0 || activeGoalSteps.length > 0);
  
  // Get personalized welcome message based on user type
  const welcomeMessage = userContext ? getWelcomeMessage(userContext, isFirstTimeUser) : {
    title: 'Welcome!',
    subtitle: 'Loading your personalized experience...'
  };
  
  const handleSnooze = (goalId: string, duration: '15m' | '1h') => {
    console.log(`Snoozing goal ${goalId} for ${duration}`);
  };

  const handleSkip = (goalId: string) => {
    console.log(`Skipping goal ${goalId}`);
  };

  const handleMakeSmaller = (goalId: string) => {
    console.log(`Making goal ${goalId} smaller`);
  };

  const handleMoveToTomorrow = (goalId: string) => {
    console.log(`Moving goal ${goalId} to tomorrow`);
  };

  const handleDismiss = (goalId: string) => {
    console.log(`Dismissing goal ${goalId}`);
  };

  const handleResumeGoal = () => {
    if (activeGoal) {
      onNavigate('goal-detail', activeGoal.id);
    }
  };

  const handleNewGoal = () => {
    // Clear the first-time user flag when they start creating a goal
    if (justCompletedOnboarding) {
      clearJustCompletedOnboarding();
    }
    onNavigate('goal-wizard');
  };

  const handleNeedHelp = () => {
    onNavigate('ai-chat');
  };

  const handleCompleteStep = () => {
    if (todaysDueItem) {
      // Navigate to step completion flow or show completion modal
      onNavigate('step-complete', todaysDueItem.step.id);
    }
  };

  const handleViewStep = () => {
    if (todaysDueItem) {
      onNavigate('goal-detail', todaysDueItem.goal.id);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background p-4">
      <div className="max-w-md mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-foreground rounded-full"></div>
            <h1 className="text-xl font-bold text-foreground">lunebeam</h1>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onNavigate('ai-chat')}
            className="text-primary"
          >
            <MessageCircle className="h-5 w-5" />
          </Button>
        </div>

        {/* Welcome Message */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            {welcomeMessage.title}
          </h1>
          <p className="text-muted-foreground">
            {welcomeMessage.subtitle}
          </p>
        </div>

        {/* Today's Focus Card - Always show */}
        <TodaysFocusCard
          step={todaysDueItem?.step}
          goal={todaysDueItem?.goal}
          upcomingSteps={upcomingSteps}
          onCompleteStep={handleCompleteStep}
          onViewStep={handleViewStep}
          onNeedHelp={handleNeedHelp}
        />

        {/* Checked In Today */}
        {!isFirstTimeUser && recentCheckIns.some(checkIn => isToday(new Date(checkIn.date))) && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-800">Checked In Today</h3>
                  <p className="text-sm text-green-600">Great job staying on track!</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}


        {/* Your Goals */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Your Goals</h2>
          </div>
          
          {goals.filter(goal => goal.status === 'active' || goal.status === 'planned').length > 0 ? (
            <div className="space-y-3">
              {goals
                .filter(goal => goal.status === 'active' || goal.status === 'planned')
                .slice(0, 3)
                .map((goal) => (
                 <Card key={goal.id}>
                   <CardContent className="p-4">
                     <div className="flex items-center justify-between mb-3">
                       <div className="flex-1">
                         <div className="flex items-center gap-2 mb-1">
                           <h3 className="font-semibold text-foreground">{goal.title}</h3>
                           {goal.owner_id !== user?.id && profiles[goal.owner_id] && (
                             <Badge variant="secondary" className="text-xs">
                               <Users className="h-3 w-3 mr-1" />
                               For {profiles[goal.owner_id].first_name}
                             </Badge>
                           )}
                           {goal.created_by !== user?.id && goal.created_by !== goal.owner_id && profiles[goal.created_by] && (
                             <Badge variant="outline" className="text-xs">
                               <UserCheck className="h-3 w-3 mr-1" />
                               Created by {profiles[goal.created_by].first_name}
                             </Badge>
                           )}
                         </div>
                         <div className="flex items-center gap-2">
                           <div className="w-16 bg-muted rounded-full h-1.5">
                             <div 
                               className="bg-primary h-1.5 rounded-full transition-all duration-300"
                               style={{ width: `${Math.round(goal.progress_pct || 0)}%` }}
                             />
                           </div>
                           <span className="text-xs text-muted-foreground">
                             {Math.round(goal.progress_pct || 0)}%
                           </span>
                         </div>
                       </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => onNavigate('check-in', goal)}
                          className="bg-primary hover:bg-primary/90"
                        >
                          Continue
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => onNavigate('goal-detail', goal.id)}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Show More button as a card when there are more than 3 goals */}
              {goals.filter(goal => goal.status === 'active' || goal.status === 'planned').length > 3 && (
                <Card 
                  className="cursor-pointer hover:bg-muted/50 transition-colors border-dashed"
                  onClick={() => onNavigate('goals')}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-end text-right w-full">
                      <div className="text-muted-foreground flex items-center gap-2">
                        <p className="text-sm font-medium">
                          More Goals
                        </p>
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : null}
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="text-center">
            <CardContent className="p-4">
              <Trophy className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
              <div className="text-2xl font-bold">{allCompletedAndArchived.length || 0}</div>
              <div className="text-xs text-muted-foreground">Goals Completed</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <Coins className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold">{totalPoints}</div>
              <div className="text-xs text-muted-foreground">LunaPoints</div>
            </CardContent>
          </Card>
        </div>

        {/* Add Goal and Rewards Cards */}
        <div className="space-y-4">
          {/* Add Goal - Only show for admin users or if no goals exist */}
          {!hasActiveOrPlannedGoals && (
            <Card 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onNavigate('add-goal')}
            >
              <CardContent className="p-6 text-center space-y-3">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto">
                  <Plus className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Add Goal</p>
                  <p className="text-sm text-muted-foreground">Start something new</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* LunaPoints */}
          <Card 
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => onNavigate('rewards')}
          >
            <CardContent className="p-6 text-center space-y-3">
              <Coins className="h-12 w-12 mx-auto text-green-500" />
              <div>
                <div className="text-2xl font-bold">{totalPoints}</div>
                <p className="font-semibold text-foreground">LunaPoints</p>
                <p className="text-sm text-muted-foreground">View your points</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Show personalized greeting only for admin users or first-time users */}
        {isFirstTimeUser && (
          <PersonalizedGreeting 
            onResumeGoal={handleResumeGoal}
            onNewGoal={handleNewGoal}
          />
        )}
        
        <NotificationSystem
          goals={goals}
          onSnoozeGoal={(goalId) => handleSnooze(goalId, '1h')}
          onSkipGoal={handleSkip}
          onMakeSmallerGoal={handleMakeSmaller}
          onMoveToTomorrow={handleMoveToTomorrow}
          onDismissGoal={handleDismiss}
        />
      </div>
    </div>
  );
};

export { HomeDashboard };