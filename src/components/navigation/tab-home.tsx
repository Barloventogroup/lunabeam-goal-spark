import React, { useState, useEffect } from 'react';
import { CheckCircle, Plus, Award, ChevronRight, Star, Coins } from 'lucide-react';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { parseISO, isToday } from 'date-fns';

import { RewardsScreen } from '../lunebeam/rewards-screen';
import { RewardsGallery } from '../lunebeam/reward-bank';
import { WeeklyCheckinModal } from '../lunebeam/weekly-checkin-modal';
import { GoalsWizard } from '../lunebeam/goals-wizard';
import { PointsDisplay } from '../lunebeam/points-display';
import { FirstTimeReminder } from '../lunebeam/first-time-reminder';
import { TodaysFocusCard } from '../lunebeam/todays-focus-card';
import { UpcomingStepsCard } from '../lunebeam/upcoming-steps-card';
import { useStore } from '../../store/useStore';
import type { Goal } from '../../types';

interface TabHomeProps {
  onOpenChat: () => void;
  onNavigateToGoals: (goalId?: string) => void;
}

type HomeView = 'dashboard' | 'rewards' | 'checkin' | 'add-goal' | 'reward-bank';

export const TabHome: React.FC<TabHomeProps> = ({
  onOpenChat,
  onNavigateToGoals
}) => {
  const [currentView, setCurrentView] = useState<HomeView>('dashboard');
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  const {
    profile,
    loadProfile,
    goals,
    steps,
    pointsSummary,
    loadGoals,
    loadPoints
  } = useStore();

  useEffect(() => {
    console.log('TabHome mounted - loading data');
    loadProfile();
    loadGoals();
    loadPoints();
  }, [loadProfile, loadGoals, loadPoints]);

  // Refresh data when component becomes visible
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('TabHome: Periodic refresh');
      loadGoals();
      loadPoints();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [loadGoals]);

  if (currentView === 'rewards') {
    return <RewardsScreen onBack={() => setCurrentView('dashboard')} />;
  }
  if (currentView === 'reward-bank') {
    return <RewardsGallery onBack={() => setCurrentView('dashboard')} />;
  }
  if (currentView === 'add-goal') {
    return <div className="min-h-screen">
        <GoalsWizard onComplete={() => setCurrentView('dashboard')} onBack={() => setCurrentView('dashboard')} />
      </div>;
  }

  // Active goals from store
  const activeGoals = goals.filter(g => g.status === 'active' || g.status === 'planned');
  const displayName = profile?.first_name ? profile.first_name.charAt(0).toUpperCase() + profile.first_name.slice(1) : 'there';
  const mockPoints = 247; // Placeholder points to match Rewards screen

  // Compute today's due step and next upcoming steps
  const getTodaysStepsAndNext = () => {
    const todaysSteps: Array<{ step: any; goal: Goal }> = [];
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
              if (isToday(dueDate)) {
                todaysSteps.push({ step, goal });
              } else if (dueDate >= new Date()) {
                upcomingSteps.push({ step, goal, dueDate });
              }
            }
          }
        });
      }
    });

    console.log('All steps debug:', allStepsDebug);
    upcomingSteps.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
    return { todaysSteps, upcomingSteps: upcomingSteps.slice(0, 3) };
  };

  const { todaysSteps, upcomingSteps } = getTodaysStepsAndNext();
  const todaysDueItem = todaysSteps[0] || null;
  
  console.log('TabHome debug:', { 
    goalsCount: goals.length, 
    stepsCount: Object.keys(steps).length,
    todaysStepsCount: todaysSteps.length,
    upcomingStepsCount: upcomingSteps.length,
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
            {/* LunaPoints Display */}
            <div className="flex items-center gap-1 bg-muted px-3 py-1.5 rounded-full">
              <Coins className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium">{pointsSummary?.totalPoints || 0}</span>
            </div>
            
            {/* User Avatar */}
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-blue-500 text-white text-sm font-medium">
                {profile?.first_name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Welcome Message */}
          <div>
            <h2 className="text-2xl font-bold mb-1">
              {activeGoals.length === 0 ? `Welcome ${displayName}!` : `Welcome back, ${displayName}!!`}
            </h2>
            {activeGoals.length === 0 ? <p className="text-muted-foreground">
                👋 Hey {displayName}! Welcome aboard. Let's kick things off by setting your very first goal (see that big plus sign in the blue circle — that is where you start). And remember, big or small, every step counts.
              </p> : <p className="text-muted-foreground">Let's keep moving forward, one step at a time.</p>}
          </div>

          {/* First Time User Reminder */}
          {activeGoals.length === 0 && (
            <FirstTimeReminder onNavigateToGoals={() => setCurrentView('add-goal')} />
          )}

          {/* Today's Focus Card - Always show */}
          <TodaysFocusCard
            step={todaysDueItem?.step}
            goal={todaysDueItem?.goal}
            upcomingSteps={upcomingSteps}
            onViewStep={handleViewStep}
            onNeedHelp={onOpenChat}
          />

          {/* Upcoming Steps Card */}
          <UpcomingStepsCard
            upcomingSteps={upcomingSteps}
            onViewStep={handleViewUpcomingStep}
          />



          <Card className="bg-gradient-to-r from-muted/5 to-accent/5 border-muted">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-foreground">
                <span>Your Goals</span>
                <Button onClick={() => setCurrentView('add-goal')} size="sm" className="rounded-full w-8 h-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105" aria-label="Add Goal">
                  <Plus className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeGoals.length > 0 ? (
                <>
                  {activeGoals.slice(0, 3).map(goal => (
                    <div key={goal.id} className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
                      <div className="flex-1" onClick={() => onNavigateToGoals(goal.id)}>
                        <h4 className="text-sm font-medium mb-1">{goal.title}</h4>
                        <p className="text-xs text-muted-foreground">
                          {Math.round(goal.progress_pct || 0)}% complete
                        </p>
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
                          Check In
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

          {/* LunaPoints */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">LunaPoints</h3>

            {/* Points card */}
            <Card className="shadow-soft">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Coins className="h-8 w-8 text-green-500" />
                    <div>
                      <div className="text-2xl font-bold">{pointsSummary?.totalPoints || 0}</div>
                      <p className="text-sm text-muted-foreground">Points available</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => setCurrentView('reward-bank')}
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      Redeem
                    </Button>
                    <Button 
                      size="sm" 
                      variant="default"
                      onClick={() => setCurrentView('rewards')}
                    >
                      View
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

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
