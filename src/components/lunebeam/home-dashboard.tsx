import React, { useEffect } from 'react';
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
  Coins
} from 'lucide-react';
import { AIChat } from './ai-chat';
import { FamilyCircleCard } from './family-circle-card';
import { PersonalizedGreeting } from './personalized-greeting';
import { NotificationSystem } from './notification-system';
import { StepsList } from './steps-list';
import { StepsChat } from './steps-chat';
import { ProgressBar } from './progress-bar';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/components/auth/auth-provider';
import { format, addDays, isToday } from 'date-fns';

interface HomeDashboardProps {
  onNavigate: (view: string, data?: any) => void;
}

const HomeDashboard: React.FC<HomeDashboardProps> = ({ onNavigate }) => {
  const { 
    profile, 
    goals,
    steps,
    getActiveGoal, 
    getRecentCheckIns, 
    badges, 
    evidence,
    familyCircles,
    justCompletedOnboarding,
    loadProfile,
    loadGoals,
    loadSteps,
    loadCheckIns,
    loadBadges,
    loadEvidence,
    loadFamilyCircles,
    clearJustCompletedOnboarding,
    createFamilyCircle
  } = useStore();
  
  const { user, signOut } = useAuth();

  useEffect(() => {
    if (user) {
      console.log('Loading data for user:', user.id);
      loadProfile();
      loadGoals();
      loadCheckIns();
      loadBadges();
      loadEvidence();
      loadFamilyCircles();
    }
  }, [user, loadProfile, loadGoals, loadCheckIns, loadBadges, loadEvidence, loadFamilyCircles]);

  // Add refresh data when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        console.log('Tab became visible - refreshing goals data');
        loadGoals();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, loadGoals]);

  const activeGoal = getActiveGoal();
  const activeGoalSteps = activeGoal ? steps[activeGoal.id] || [] : [];

  useEffect(() => {
    // Load steps for active goal when it changes
    if (activeGoal) {
      loadSteps(activeGoal.id);
    }
  }, [activeGoal?.id, loadSteps]);
  const recentCheckIns = activeGoal ? getRecentCheckIns(activeGoal.id) : [];
  const thisWeekBadges = badges.filter(badge => {
    const earnedDate = new Date(badge.earned_at);
    const weekAgo = addDays(new Date(), -7);
    return earnedDate >= weekAgo;
  });

  // Calculate stats for consistency with rewards screen
  const completedGoals = goals.filter(goal => goal.status === 'completed');
  const archivedGoals = goals.filter(goal => goal.status === 'archived');
  const allCompletedAndArchived = [...completedGoals, ...archivedGoals];
  const mockPoints = 247; // Matching rewards screen

  // Debug logging
  console.log('HomeDashboard Debug:', {
    badges: badges,
    badgesLength: badges.length,
    mockPoints: mockPoints,
    allCompletedAndArchived: allCompletedAndArchived.length
  });

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
  
  const hasActiveOrPlannedGoals = goals.some(goal => goal.status === 'active' || goal.status === 'planned');
  const isFirstTimeUser = justCompletedOnboarding && !hasActiveOrPlannedGoals;
  const hasProgressToShow = activeGoal && ((activeGoal.progress_pct || 0) > 0 || activeGoalSteps.length > 0);
  const displayName = profile?.first_name ? profile.first_name.charAt(0).toUpperCase() + profile.first_name.slice(1) : 'User';
  
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

  const handleTodaysSteps = () => {
    onNavigate('weekly');
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-foreground rounded-full"></div>
            <h1 className="text-xl font-semibold text-foreground">lunebeam</h1>
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
            {isFirstTimeUser ? <>Welcome {displayName}!</> : <>Welcome back, {displayName}!!</>}
          </h1>
          {isFirstTimeUser ? (
            <p className="text-muted-foreground">
              👋 Hey {displayName}! Welcome aboard. Let’s kick things off by setting your very first goal (see that big plus sign in the blue circle — that is where you start). And remember, big or small, every step counts. Ready to get started?
            </p>
          ) : (
            <p className="text-muted-foreground">
              Let's keep moving forward, one step at a time.
            </p>
          )}
        </div>

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
                        <h3 className="font-semibold text-foreground mb-1">{goal.title}</h3>
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
        <div className="grid grid-cols-3 gap-4">
          <Card className="text-center">
            <CardContent className="p-4">
              <Trophy className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
              <div className="text-2xl font-bold">{allCompletedAndArchived.length || 0}</div>
              <div className="text-xs text-muted-foreground">Goals Completed</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <Star className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">{badges.length || 0}</div>
              <div className="text-xs text-muted-foreground">Badges Earned</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <Coins className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold">{mockPoints || 247}</div>
              <div className="text-xs text-muted-foreground">Points</div>
            </CardContent>
          </Card>
        </div>

        {/* Add Goal and Rewards Cards */}
        <div className="space-y-4">
          {/* Add Goal */}
          <Card 
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => onNavigate('goal-wizard')}
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

          {/* Rewards */}
          <Card 
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => onNavigate('badges')}
          >
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Rewards</h3>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
              {/* Debug: Force render to see if this section is being reached */}
              <div style={{background: 'red', padding: '10px', color: 'white'}}>
                DEBUG: badges={badges.length}, points={mockPoints}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted/30">
                  <Star className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                  <div className="text-2xl font-bold">{badges.length || 0}</div>
                  <div className="text-xs text-muted-foreground">Badges Earned</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/30">
                  <Coins className="h-6 w-6 mx-auto mb-2 text-green-500" />
                  <div className="text-2xl font-bold">{mockPoints || 247}</div>
                  <div className="text-xs text-muted-foreground">Points</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {!isFirstTimeUser && (
          <PersonalizedGreeting 
            onResumeGoal={handleResumeGoal}
            onNewGoal={handleNewGoal}
            onTodaysSteps={handleTodaysSteps}
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