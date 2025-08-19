import React from 'react';
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
  Sparkles
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { format, addDays, isToday } from 'date-fns';

interface HomeDashboardProps {
  onNavigate: (view: string, data?: any) => void;
}

const HomeDashboard: React.FC<HomeDashboardProps> = ({ onNavigate }) => {
  const { profile, getActiveGoal, getRecentCheckIns, badges, evidence } = useStore();
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
    
    switch (activeGoal.check_ins.frequency) {
      case 'daily':
        return addDays(lastDate, 1);
      case 'every_other_day':
        return addDays(lastDate, 2);
      case 'once_midweek':
        return addDays(lastDate, 3);
      default:
        return addDays(lastDate, 1);
    }
  };

  const nextCheckIn = getNextCheckInDate();
  const isCheckInDue = nextCheckIn ? isToday(nextCheckIn) || nextCheckIn < new Date() : true;

  return (
    <div className="min-h-screen bg-gradient-soft p-4">
      <div className="max-w-md mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            Hello, {profile?.first_name}! 🌟
          </h1>
          <p className="text-foreground-soft">
            {format(new Date(), 'EEEE, MMMM d')}
          </p>
        </div>

        {/* Active Goal Card */}
        {activeGoal ? (
          <Card 
            className="bg-gradient-primary text-primary-foreground shadow-elevated cursor-pointer transform hover:scale-[1.02] transition-bounce"
            onClick={() => onNavigate('goal-detail', activeGoal)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">This Week's Goal</CardTitle>
                <Target className="h-6 w-6" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <h3 className="text-xl font-semibold">{activeGoal.title}</h3>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm opacity-90">Progress</p>
                  <p className="font-medium">{Math.round(getGoalProgress())}% Complete</p>
                </div>
                <ProgressRing progress={getGoalProgress()} size="md" color="encouraging">
                  <span className="text-sm font-bold text-encouraging">
                    {Math.round(getGoalProgress())}%
                  </span>
                </ProgressRing>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="opacity-75">Time Budget</p>
                  <p className="font-medium">{activeGoal.week_plan.time_per_day}</p>
                </div>
                <div>
                  <p className="opacity-75">Check-ins</p>
                  <p className="font-medium">{recentCheckIns.length} recorded</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card 
            className="border-dashed border-2 border-primary/30 bg-primary-soft/20 cursor-pointer hover:bg-primary-soft/30 transition-smooth"
            onClick={() => onNavigate('goal-wizard')}
          >
            <CardContent className="p-8 text-center space-y-4">
              <div className="rounded-full bg-primary/10 w-16 h-16 flex items-center justify-center mx-auto">
                <Plus className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Ready for a tiny goal?</h3>
                <p className="text-foreground-soft">Let's pick something small and meaningful for this week</p>
              </div>
              <Button variant="large" size="lg">
                Pick a Goal
              </Button>
            </CardContent>
          </Card>
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

          {/* Supporters */}
          <Card 
            className="cursor-pointer hover:bg-card-soft transition-smooth"
            onClick={() => onNavigate('supporters')}
          >
            <CardContent className="p-4 text-center space-y-3">
              <div className="rounded-full bg-supportive-soft w-12 h-12 flex items-center justify-center mx-auto">
                <Users className="h-6 w-6 text-supportive" />
              </div>
              <div>
                <p className="font-medium text-sm">Supporters</p>
                <p className="text-xs text-foreground-soft">
                  2 people cheering you on
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