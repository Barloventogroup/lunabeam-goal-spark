import React, { useState, useEffect } from 'react';
import { Home, Target, Users, User, MessageCircle, ArrowLeft } from 'lucide-react';
import { TabHome } from './tab-home';
import { TabGoals } from './tab-goals';
import { TabTeam } from './tab-team';
import { TabTeamIndividual } from './tab-team-individual';
import { TabYou } from './tab-you';
import { AIChat } from '../lunebeam/ai-chat';
import { useStore } from '@/store/useStore';

type TabType = 'home' | 'goals' | 'team' | 'you' | 'chat';

export const BottomTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [showChat, setShowChat] = useState(false);
  const [isWizardActive, setIsWizardActive] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const { loadGoals, userContext } = useStore();

  const tabs = [
    {
      id: 'home' as const,
      label: 'Home',
      icon: Home,
    },
    {
      id: 'goals' as const,
      label: 'Goals',
      icon: Target,
    },
    {
      id: 'team' as const,
      label: 'Community',
      icon: Users,
    },
    {
      id: 'you' as const,
      label: 'You',
      icon: User,
    },
  ];

  // Refresh data when switching to home tab and clear goal selection when leaving goals
  useEffect(() => {
    if (activeTab === 'home') {
      console.log('Switched to home tab - refreshing data');
      loadGoals();
    } else if (activeTab !== 'goals') {
      // Clear selected goal when leaving goals tab
      setSelectedGoalId(null);
    }
  }, [activeTab, loadGoals]);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'home':
        return <TabHome 
          onOpenChat={() => setShowChat(true)} 
          onNavigateToGoals={(goalId?: string) => {
            setActiveTab('goals');
            setSelectedGoalId(goalId || null);
          }}
          onNavigateToNotifications={() => setActiveTab('you')}
        />;
      case 'goals':
        return <TabGoals onWizardStateChange={setIsWizardActive} initialGoalId={selectedGoalId} />;
      case 'team':
        return userContext?.userType === 'individual' ? <TabTeamIndividual /> : <TabTeam />;
      case 'you':
        return <TabYou />;
      default:
        return <TabHome 
          onOpenChat={() => setShowChat(true)} 
          onNavigateToGoals={() => setActiveTab('goals')}
          onNavigateToNotifications={() => setActiveTab('you')}
        />;
    }
  };

  // Full-screen chat overlay
  if (showChat) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-between p-4 border-b bg-card/80 backdrop-blur">
          <button 
            onClick={() => setShowChat(false)}
            className="text-primary hover:text-primary/80 p-2 rounded-md hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <h1 className="font-semibold">Lune Chat</h1>
          </div>
          <div></div>
        </div>
        <div className="h-[calc(100vh-73px)]">
          <AIChat context="general" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Main content */}
      <div className={`flex-1 ${isWizardActive ? 'pb-0' : 'pb-20'}`}>
        {renderActiveTab()}
      </div>

      {/* Bottom tab bar - hidden during wizard */}
      {!isWizardActive && (
        <div className="fixed bottom-0 left-0 right-0 bg-card backdrop-blur border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.1)] opacity-90">
          <div className="flex items-center justify-around px-2 py-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    // Clear selected goal when clicking Goals tab directly
                    if (tab.id === 'goals') {
                      setSelectedGoalId(null);
                    }
                  }}
                  className={`flex flex-col items-center justify-center min-w-0 flex-1 py-2 px-1 rounded-lg transition-colors ${
                    isActive 
                      ? 'text-primary bg-primary/10' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <Icon className={`h-5 w-5 mb-1 ${isActive ? 'text-primary' : ''}`} />
                  <span className="text-xs font-medium truncate">
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};