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
  MessageCircle
} from 'lucide-react';
import { AIChat } from './ai-chat';
import { FamilyCircleCard } from './family-circle-card';
import { PersonalizedGreeting } from './personalized-greeting';
import { NotificationSystem } from './notification-system';
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
    getActiveGoal, 
    getRecentCheckIns, 
    badges, 
    evidence,
    familyCircles,
    loadProfile,
    loadGoals,
    loadCheckIns,
    loadBadges,
    loadEvidence,
    loadFamilyCircles,
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
  const activeGoal = getActiveGoal();
  const recentCheckIns = activeGoal ? getRecentCheckIns(activeGoal.id) : [];
  const thisWeekBadges = badges.filter(badge => {
    const earnedDate = new Date(badge.earned_at);
    const weekAgo = addDays(new Date(), -7);
    return earnedDate >= weekAgo;
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
            {goals.length === 0 ? `Welcome ${profile?.first_name || 'User'}!` : `Welcome back, ${profile?.first_name || 'User'}!!`}
          </h1>
          {goals.length === 0 ? (
            <p className="text-muted-foreground">
              👋 Hey {profile?.first_name || 'User'}! Welcome aboard. Let's kick things off by setting your very first goal (see that big plus sign in the blue circle? That is where you start. And remember, big or small, every step counts. Ready to get started?
            </p>
          ) : (
            <p className="text-muted-foreground">
              Let's keep moving forward, one step at a time.
            </p>
          )}
        </div>

        {/* Checked In Today */}
        {goals.length > 0 && recentCheckIns.some(checkIn => isToday(new Date(checkIn.date))) && (
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

        {/* This Week's Progress */}
        {goals.length > 0 && activeGoal && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">This Week's Progress</h2>
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="w-full bg-muted rounded-full h-3">
                    <div 
                      className="bg-primary h-3 rounded-full transition-all duration-300"
                      style={{ width: `${Math.round(activeGoal.progress_pct || 0)}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {Math.round(activeGoal.progress_pct || 0)}% of goal completed
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Your Goals */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Your Goals</h2>
          
          {goals.filter(goal => goal.status === 'active' || goal.status === 'planned').length > 0 ? (
            <div className="space-y-3">
              {goals.filter(goal => goal.status === 'active' || goal.status === 'planned').map((goal) => (
                <Card key={goal.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-1">{goal.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {Math.round(goal.progress_pct || 0)}% complete • Next step due today
                        </p>
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
                          View Plan
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : null}
        </div>

        {/* Add Goal and Rewards Cards */}
        <div className="grid grid-cols-2 gap-4">
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
            <CardContent className="p-6 text-center space-y-3">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Rewards</p>
                <p className="text-sm text-muted-foreground">
                  {thisWeekBadges.length > 0 
                    ? `${thisWeekBadges.length} new achievement${thisWeekBadges.length !== 1 ? 's' : ''}`
                    : `${badges.length} badge${badges.length !== 1 ? 's' : ''} earned`
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {goals.length > 0 && (
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