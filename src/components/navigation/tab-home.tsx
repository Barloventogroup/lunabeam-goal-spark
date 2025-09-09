import React, { useState, useEffect } from 'react';
import { MessageCircle, CheckCircle, Plus, Award, ChevronRight, Star, Coins } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
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

    goals.forEach((goal) => {
      if (goal.status === 'active' || goal.status === 'planned') {
        const goalSteps = steps[goal.id] || [];
        goalSteps.forEach((step) => {
          if (step.due_date && step.status === 'todo') {
            try {
              const dueDate = parseISO(step.due_date);
              if (isToday(dueDate)) {
                todaysSteps.push({ step, goal });
              } else if (dueDate >= new Date()) {
                upcomingSteps.push({ step, goal, dueDate });
              }
            } catch (e) {
              console.warn('TabHome: invalid due_date for step', step.id, step.due_date);
            }
          }
        });
      }
    });

    upcomingSteps.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
    return { todaysSteps, upcomingSteps: upcomingSteps.slice(0, 3) };
  };

  const { todaysSteps, upcomingSteps } = getTodaysStepsAndNext();
  const todaysDueItem = todaysSteps[0] || null;

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

          {/* Checked In Today */}
          {activeGoals.length > 0 && <Card className="bg-green-50 shadow-soft">
              <CardContent className="flex items-center gap-3 p-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-800">Checked In Today</h3>
                  <p className="text-sm text-green-700">Great job staying on track!</p>
                </div>
              </CardContent>
            </Card>}


          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Your Goals</h3>
              <Button onClick={() => setCurrentView('add-goal')} size="sm" className="rounded-full w-8 h-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105" aria-label="Add Goal">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {activeGoals.length > 0 ? <div className="space-y-3">
                {activeGoals.slice(0, 3).map(goal => <Card key={goal.id} className="cursor-pointer hover:shadow-card transition-all duration-200 shadow-soft">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1" onClick={() => onNavigateToGoals(goal.id)}>
                          <h4 className="text-sm font-bold mb-1">{goal.title}</h4>
                          <p className="text-sm text-muted-foreground">
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
                           <Button variant="default" size="sm" onClick={() => onNavigateToGoals(goal.id)}>
                             View
                           </Button>
                         </div>
                      </div>
                    </CardContent>
                  </Card>)}
                
                {/* Show More button as a card when there are more than 3 goals */}
                {activeGoals.length > 3 && (
                  <Card 
                    className="cursor-pointer hover:bg-muted/50 transition-colors border-dashed"
                    onClick={() => onNavigateToGoals()}
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
              </div> : <Card className="shadow-soft">
                <CardContent className="p-6 text-center text-muted-foreground">
                  No active goals yet
                </CardContent>
              </Card>}
          </div>

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
