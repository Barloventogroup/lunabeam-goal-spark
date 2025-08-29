import React, { useState } from 'react';
import { MessageCircle, Bell } from 'lucide-react';
import lunebeamLogo from '../../assets/lunebeam-logo.svg';
import { ThisWeeksGoals } from '../lunebeam/this-weeks-goals';
import { QuickActions } from '../lunebeam/quick-actions';
import { RewardsScreen } from '../lunebeam/rewards-screen';
import { WeeklyCheckinModal } from '../lunebeam/weekly-checkin-modal';
import { GoalWizard } from '../lunebeam/goal-wizard';
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
  if (currentView === 'rewards') {
    return <RewardsScreen onBack={() => setCurrentView('dashboard')} />;
  }
  if (currentView === 'add-goal') {
    return <div className="min-h-screen">
        <GoalWizard onComplete={() => setCurrentView('dashboard')} />
      </div>;
  }
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
          {/* This Week's Goals Carousel */}
          <ThisWeeksGoals onGoalClick={onNavigateToGoals} />

          {/* Quick Actions */}
          <QuickActions onCheckinClick={() => setShowCheckinModal(true)} onAddGoalClick={() => setCurrentView('add-goal')} onRewardsClick={() => setCurrentView('rewards')} />

          {/* Encouragement Tile */}
          <div className="bg-card rounded-lg p-4 border border-encouraging/20">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-encouraging/10 flex items-center justify-center flex-shrink-0">
                <span className="text-encouraging text-lg">✨</span>
              </div>
              <div>
                <h3 className="font-medium text-encouraging mb-1">
                  Small steps lead to big changes
                </h3>
                <p className="text-sm text-encouraging/80">
                  Remember, progress isn't about perfection—it's about showing up consistently for yourself.
                </p>
              </div>
            </div>
          </div>
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