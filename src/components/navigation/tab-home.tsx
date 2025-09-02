import React, { useState, useEffect } from 'react';
import { MessageCircle, CheckCircle, Plus, Award } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { RewardsScreen } from '../lunebeam/rewards-screen';
import { WeeklyCheckinModal } from '../lunebeam/weekly-checkin-modal';
import { GoalWizard } from '../lunebeam/goal-wizard';
import { useStore } from '../../store/useStore';
interface TabHomeProps {
  onOpenChat: () => void;
  onNavigateToGoals: (goalId?: string) => void;
}
type HomeView = 'dashboard' | 'rewards' | 'checkin' | 'add-goal';
export const TabHome: React.FC<TabHomeProps> = ({
  onOpenChat,
  onNavigateToGoals
}) => {
  const [currentView, setCurrentView] = useState<HomeView>('dashboard');
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const { profile, loadProfile, goals, badges, loadGoals, loadBadges } = useStore();
  
  useEffect(() => {
    loadProfile();
    loadGoals();
    loadBadges();
  }, [loadProfile, loadGoals, loadBadges]);
  
  if (currentView === 'rewards') {
    return <RewardsScreen onBack={() => setCurrentView('dashboard')} />;
  }
  if (currentView === 'add-goal') {
    return <div className="min-h-screen">
        <GoalWizard onComplete={() => setCurrentView('dashboard')} />
      </div>;
  }

  // Active goals from store
  const activeGoals = goals.filter((g) => g.status === 'active' || g.status === 'planned');

  return <>
      <div className="min-h-screen bg-gradient-soft">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-card/80 backdrop-blur border-b">
          <div className="flex items-center">
            <img 
              src="/lovable-uploads/d51154b6-d57c-4e03-a2c8-55e214d3b5c2.png" 
              alt="Lunabeam logo" 
              className="h-12 w-auto object-cover object-center"
              style={{ objectPosition: 'center' }}
            />
          </div>
          
          <button onClick={onOpenChat} className="flex items-center justify-center w-11 h-11 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors" aria-label="Open Lune Chat">
            <MessageCircle className="h-5 w-5 text-primary" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Welcome Message */}
          <div>
            <h2 className="text-2xl font-bold mb-1">
              Welcome back, {profile?.first_name || 'there'}!!
            </h2>
            <p className="text-muted-foreground">Let's keep moving forward, one step at a time.</p>
          </div>

          {/* Checked In Today */}
          <Card className="bg-green-50 border-green-200">
            <CardContent className="flex items-center gap-3 p-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-800">Checked In Today</h3>
                <p className="text-sm text-green-700">Great job staying on track!</p>
              </div>
            </CardContent>
          </Card>

          {/* This Week's Progress */}
          <div>
            <h3 className="text-lg font-semibold mb-3">This Week's Progress</h3>
            <Card>
              <CardContent className="p-4">
                <Progress value={60} className="mb-2" />
                <p className="text-sm text-muted-foreground">3 of 5 steps completed</p>
              </CardContent>
            </Card>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Your Goals</h3>
              <Button
                onClick={() => setCurrentView('add-goal')}
                size="sm"
                className="rounded-full w-8 h-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                aria-label="Add Goal"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {activeGoals.length > 0 ? (
              <div className="space-y-3">
                {activeGoals.map((goal) => (
                  <Card key={goal.id} className="cursor-pointer hover:shadow-md transition-shadow">
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
                            onClick={() => setShowCheckinModal(true)}
                          >
                            Check In
                          </Button>
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => onNavigateToGoals(goal.id)}
                          >
                            View Plan
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  No active goals yet
                </CardContent>
              </Card>
            )}
          </div>

          {/* Rewards/Badges */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Rewards</h3>
            {badges.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {badges.slice(0,4).map((b) => (
                  <Card key={b.id} className="bg-card/60">
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
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  No badges yet — complete goals to earn rewards!
                </CardContent>
              </Card>
            )}
          </div>

          {/* Encouragement Message */}
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">✨</span>
                <div>
                  <h3 className="font-semibold text-orange-800 mb-1">
                    Small steps lead to big changes
                  </h3>
                  <p className="text-sm text-orange-700">
                    Progress isn't about perfection — it's about showing up consistently for yourself.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Check-in Modal */}
      {showCheckinModal && <WeeklyCheckinModal isOpen={showCheckinModal} onOpenChange={setShowCheckinModal} circle={{
      id: 'default',
      name: 'My Circle',
      owner_id: '',
      created_at: '',
      updated_at: ''
    }} goals={[]} weekOf={new Date().toISOString().split('T')[0]} />}
    </>;
};