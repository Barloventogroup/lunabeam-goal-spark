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
    <div className="min-h-screen bg-gradient-soft p-4">
      <div className="max-w-md mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="text-center flex-1 space-y-2">
            <h1 className="text-3xl font-bold text-foreground">
              Hello, {profile?.first_name}! 🌟
            </h1>
            <p className="text-foreground-soft">
              {format(new Date(), 'EEEE, MMMM d')}
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={signOut}
            className="text-foreground-soft hover:text-foreground hover:bg-muted"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        <PersonalizedGreeting 
          onResumeGoal={handleResumeGoal}
          onNewGoal={handleNewGoal}
          onTodaysSteps={handleTodaysSteps}
        />
        
        <NotificationSystem
          goals={goals}
          onSnoozeGoal={(goalId) => handleSnooze(goalId, '1h')}
          onSkipGoal={handleSkip}
          onMakeSmallerGoal={handleMakeSmaller}
          onMoveToTomorrow={handleMoveToTomorrow}
          onDismissGoal={handleDismiss}
        />

        {/* Active Goals Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Target className="h-5 w-5" />
              Active Goals
            </h2>
          </div>
          
          {goals.filter(goal => goal.status === 'active' || goal.status === 'planned').length > 0 ? (
            <div className="space-y-3">
              {goals.filter(goal => goal.status === 'active' || goal.status === 'planned').map((goal) => (
                <Card key={goal.id} className="hover:bg-card-soft transition-smooth">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 cursor-pointer" onClick={() => onNavigate('goal-detail', goal.id)}>
                        <h3 className="font-medium text-foreground mb-1">{goal.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-foreground-soft">
                          <span>Progress: {Math.round(goal.progress_pct || 0)}%</span>
                          <span>Priority: {goal.priority}</span>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => onNavigate('check-in', goal)}
                        className="ml-4 shrink-0"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Check In
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-2 border-muted">
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground mb-4">No active goals yet</p>
                <p className="text-sm text-muted-foreground">Create your first goal to get started!</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Centered Add Goal Button */}
        <div className="flex justify-center py-4">
          <Button
            onClick={() => onNavigate('goal-wizard')}
            size="lg"
            className="rounded-full w-16 h-16 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
          >
            <Plus className="h-8 w-8" />
          </Button>
        </div>

        {/* Rewards/Badges Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Award className="h-5 w-5" />
              Rewards & Badges
            </h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onNavigate('badges')}
              className="text-primary"
            >
              View All
            </Button>
          </div>
          
          {badges.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {badges.slice(0, 4).map((badge) => (
                <Card key={badge.id} className="bg-gradient-subtle border-0">
                  <CardContent className="p-4 text-center space-y-2">
                    <div className="rounded-full bg-accent w-12 h-12 flex items-center justify-center mx-auto">
                      <Award className="h-6 w-6 text-accent-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{badge.title}</p>
                      <p className="text-xs text-muted-foreground">{badge.type}</p>
                      {thisWeekBadges.some(tb => tb.id === badge.id) && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          New!
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-2 border-muted">
              <CardContent className="p-6 text-center">
                <div className="rounded-full bg-muted w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <Award className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-2">No badges earned yet</p>
                <p className="text-sm text-muted-foreground">Complete goals and check-ins to earn rewards!</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Family Circle */}
        {familyCircles.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Users className="h-5 w-5" />
              Family Circle
            </h2>
            {familyCircles.map((circle) => {
              console.log('Rendering family circle:', circle);
              return (
                <FamilyCircleCard 
                  key={circle.id} 
                  circle={circle} 
                  goals={goals} 
                  onNavigate={onNavigate}
                />
              );
            })}
          </div>
        )}

        {familyCircles.length === 0 && (
          <div className="text-center py-6 space-y-4">
            <p className="text-muted-foreground mb-2">No family circles yet</p>
            <p className="text-sm text-muted-foreground">Create one to share your progress with family</p>
            <button 
              onClick={async () => {
                console.log('Creating test family circle...');
                await createFamilyCircle('My Family');
              }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              Create Test Family Circle
            </button>
          </div>
        )}

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Next Check-in */}
          <Card 
            className={`cursor-pointer transition-smooth ${isCheckInDue ? 'bg-encouraging-soft border-encouraging/30' : 'hover:bg-card-soft'}`}
            onClick={() => activeGoal && onNavigate('check-in', activeGoal)}
          >
            <CardContent className="p-4 text-center space-y-3">
              <div className={`rounded-full w-12 h-12 flex items-center justify-center mx-auto ${isCheckInDue ? 'bg-encouraging text-encouraging-foreground' : 'bg-muted text-muted-foreground'}`}>
                {isCheckInDue ? <CheckCircle2 className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
              </div>
              <div>
                <p className="font-medium text-sm">
                  {isCheckInDue ? 'Check-in Ready!' : 'Next Check-in'}
                </p>
                <p className="text-xs text-foreground-soft">
                  {nextCheckIn ? (isToday(nextCheckIn) ? 'Today' : format(nextCheckIn, 'MMM d')) : 'Not scheduled'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Rewards & Badges */}
          <Card 
            className="cursor-pointer hover:bg-card-soft transition-smooth"
            onClick={() => onNavigate('badges')}
          >
            <CardContent className="p-4 text-center space-y-3">
              <div className="rounded-full bg-accent w-12 h-12 flex items-center justify-center mx-auto">
                <Award className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <p className="font-medium text-sm">Rewards</p>
                <p className="text-xs text-foreground-soft">
                  {badges.length} badge{badges.length !== 1 ? 's' : ''} earned
                  {thisWeekBadges.length > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      +{thisWeekBadges.length} this week
                    </Badge>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Family Circle */}
          <Card 
            className="cursor-pointer hover:bg-card-soft transition-smooth"
            onClick={() => {
              if (familyCircles.length === 0) {
                // Create first family circle
                // This would typically open a create modal or navigate to setup
                onNavigate('family-setup');
              } else {
                onNavigate('family-circle', familyCircles[0]);
              }
            }}
          >
            <CardContent className="p-4 text-center space-y-3">
              <div className="rounded-full bg-supportive-soft w-12 h-12 flex items-center justify-center mx-auto">
                <Users className="h-6 w-6 text-supportive" />
              </div>
              <div>
                <p className="font-medium text-sm">Family Circle</p>
                <p className="text-xs text-foreground-soft">
                  {familyCircles.length > 0 
                    ? `${familyCircles[0].name} • Members`
                    : 'Set up family sharing'
                  }
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Evidence */}
          <Card 
            className="cursor-pointer hover:bg-card-soft transition-smooth"
            onClick={() => onNavigate('evidence')}
          >
            <CardContent className="p-4 text-center space-y-3">
              <div className="rounded-full bg-muted w-12 h-12 flex items-center justify-center mx-auto">
                <Camera className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-sm">Evidence</p>
                <p className="text-xs text-foreground-soft">
                  {evidence.length} item{evidence.length !== 1 ? 's' : ''} saved
                </p>
              </div>
            </CardContent>
          </Card>

          {/* AI Coach */}
          <Card 
            className="cursor-pointer hover:bg-card-soft transition-smooth"
            onClick={() => onNavigate('ai-chat')}
          >
            <CardContent className="p-4 text-center space-y-3">
              <div className="rounded-full bg-primary-soft w-12 h-12 flex items-center justify-center mx-auto">
                <MessageCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Lune AI Buddy</p>
                <p className="text-xs text-foreground-soft">
                  Chat with your AI buddy
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Quick Access */}
        <Card 
          className="cursor-pointer hover:bg-card-soft transition-smooth"
          onClick={() => onNavigate('profile')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-primary-soft w-12 h-12 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Profile & Settings</p>
                <p className="text-sm text-foreground-soft">Manage your info and consent</p>
              </div>
              <div className="flex items-center gap-2">
                {profile?.strengths.slice(0, 2).map((strength, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {strength}
                  </Badge>
                ))}
                {(profile?.strengths.length || 0) > 2 && (
                  <Badge variant="secondary" className="text-xs">
                    +{(profile?.strengths.length || 0) - 2}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Achievement */}
        {thisWeekBadges.length > 0 && (
          <Card className="bg-gradient-supportive text-supportive-foreground shadow-card">
            <CardContent className="p-4 text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5" />
                <span className="font-medium">New Achievement!</span>
              </div>
              <p className="text-sm opacity-90">
                You earned the "{thisWeekBadges[0].title}" badge
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export { HomeDashboard };