import React, { useState, useEffect } from 'react';
import { MessageCircle, CheckCircle, Plus, Award, ChevronRight, Star, Coins, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { RewardsScreen } from '../lunebeam/rewards-screen';
import { WeeklyCheckinModal } from '../lunebeam/weekly-checkin-modal';
import { GoalsWizard } from '../lunebeam/goals-wizard';
import { FirstTimeReminder } from '../lunebeam/first-time-reminder';
import { useStore } from '../../store/useStore';
import type { Goal } from '../../types';

interface TabHomeProps {
  onOpenChat: () => void;
  onNavigateToGoals: (goalId?: string) => void;
}

type HomeView = 'dashboard' | 'rewards' | 'checkin' | 'add-goal';

export const TabHome: React.FC<TabHomeProps> = ({
  onOpenChat,
  onNavigateToGoals
}) => {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<HomeView>('dashboard');
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  const {
    profile,
    loadProfile,
    goals,
    badges,
    loadGoals,
    loadBadges
  } = useStore();

  useEffect(() => {
    console.log('TabHome mounted - loading data');
    loadProfile();
    loadGoals();
    loadBadges();
  }, [loadProfile, loadGoals, loadBadges]);

  // Refresh data when component becomes visible
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('TabHome: Periodic refresh');
      loadGoals();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [loadGoals]);

  if (currentView === 'rewards') {
    return <RewardsScreen onBack={() => setCurrentView('dashboard')} />;
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

          {/* Invitations Card */}
          <Card 
            className="bg-gradient-subtle border-primary/20 cursor-pointer hover:shadow-elegant transition-all duration-300"
            onClick={() => navigate('/invitations')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Invitations</h3>
                    <p className="text-sm text-muted-foreground">Manage friend requests</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                    3 pending
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

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

          {/* Rewards/Badges */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Rewards</h3>

            {/* Stats inside Rewards card */}
            <Card className="shadow-soft">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-4 rounded-lg bg-muted/30">
                    <Star className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                    <div className="text-2xl font-bold">{badges.length || 0}</div>
                    <div className="text-xs text-muted-foreground">Badges Earned</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/30">
                    <Coins className="h-6 w-6 mx-auto mb-2 text-green-500" />
                    <div className="text-2xl font-bold">{mockPoints}</div>
                    <div className="text-xs text-muted-foreground">Points</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {badges.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {badges.slice(0, 4).map((b) => (
                  <Card key={b.id} className="bg-card/60 shadow-soft">
                    <CardContent className="p-4 text-center space-y-2">
                      <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center mx-auto">
                        <Award className="h-6 w-6 text-accent-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{b.title}</p>
                        <p className="text-sm text-muted-foreground">{b.type}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
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
