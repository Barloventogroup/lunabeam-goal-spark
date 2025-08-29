import React, { useState, useEffect } from 'react';
import { MessageCircle, CheckCircle, Plus, Award } from 'lucide-react';
import lunebeamLogo from '../../assets/lunebeam-logo.svg';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Progress } from '../ui/progress';
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
  const { profile, loadProfile } = useStore();
  
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);
  
  if (currentView === 'rewards') {
    return <RewardsScreen onBack={() => setCurrentView('dashboard')} />;
  }
  if (currentView === 'add-goal') {
    return <div className="min-h-screen">
        <GoalWizard onComplete={() => setCurrentView('dashboard')} />
      </div>;
  }

  // Mock data - in real app this would come from store/API
  const mockGoals = [
    {
      id: '1',
      title: 'Practice Social Skills',
      subtitle: '3 rounds this week • Next step due today',
      buttonText: 'Continue',
      buttonVariant: 'default' as const
    },
    {
      id: '2',
      title: 'Independent Living Skills',
      subtitle: '2 of 4 steps done • Explain mode available',
      buttonText: 'View Plan',
      buttonVariant: 'outline' as const
    }
  ];

  return <>
      <div className="min-h-screen bg-gradient-soft">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-card/80 backdrop-blur border-b">
          <div className="flex items-center gap-3">
            <img 
              src={lunebeamLogo} 
              alt="Lunebeam logo" 
              className="w-8 h-8"
            />
            <h1 className="text-xl font-bold">lunebeam</h1>
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

          {/* Your Goals */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Your Goals</h3>
            <div className="space-y-3">
              {mockGoals.map((goal) => (
                <Card key={goal.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">{goal.title}</h4>
                        <p className="text-sm text-muted-foreground">{goal.subtitle}</p>
                      </div>
                      <Button 
                        variant={goal.buttonVariant}
                        size="sm"
                        onClick={() => onNavigateToGoals(goal.id)}
                      >
                        {goal.buttonText}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-2"
              onClick={() => setCurrentView('add-goal')}
            >
              <Plus className="h-6 w-6 text-blue-600" />
              <div className="text-center">
                <div className="font-semibold">Add Goal</div>
                <div className="text-xs text-muted-foreground">Start something new</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-2"
              onClick={() => setCurrentView('rewards')}
            >
              <Award className="h-6 w-6 text-purple-600" />
              <div className="text-center">
                <div className="font-semibold">Rewards</div>
                <div className="text-xs text-muted-foreground">3 new achievements</div>
              </div>
            </Button>
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