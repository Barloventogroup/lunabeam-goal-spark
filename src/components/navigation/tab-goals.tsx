import React, { useState, useEffect } from 'react';
import { GoalsList } from '../lunebeam/goals-list';
import { GoalDetailV2 } from '../lunebeam/goal-detail-v2';
import { LuneAISession } from '../lunebeam/lune-ai-session';
import { GoalSummary } from '../lunebeam/goal-summary';
import { GoalCategories } from '../lunebeam/goal-categories';
import { GoalsWizard } from '../lunebeam/goals-wizard';
import { RedesignedGoalsWizard } from '../lunebeam/redesigned-goals-wizard';
import { GoalProposalsView } from '../lunebeam/goal-proposals-view';
import { SupporterGoalWizard } from '../lunebeam/supporter-goal-wizard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { User, Users, UserPlus } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { getSupporterContext } from '@/utils/supporterUtils';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type GoalsView = 'list' | 'detail' | 'categories' | 'create' | 'summary' | 'wizard' | 'create-wizard' | 'create-wizard-supporter' | 'supporter-wizard' | 'proposals';

interface TabGoalsProps {
  onWizardStateChange?: (isWizardActive: boolean) => void;
  initialGoalId?: string | null;
}

export const TabGoals: React.FC<TabGoalsProps> = ({ onWizardStateChange, initialGoalId }) => {
  const [currentView, setCurrentView] = useState<GoalsView>('list');
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [aiGoal, setAiGoal] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState<'own' | 'individual'>('own');
  const [supporterContext, setSupporterContext] = useState<any>(null);

  const { userContext } = useStore();

  // Get supporter context for supporters and hybrids
  useEffect(() => {
    if (userContext?.userType === 'supporter' || userContext?.userType === 'hybrid' || userContext?.userType === 'admin') {
      const getCurrentUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          getSupporterContext(user.id).then(setSupporterContext);
        }
      };
      getCurrentUser();
    }
  }, [userContext]);

  // Handle initial goal ID navigation
  useEffect(() => {
    if (initialGoalId) {
      setSelectedGoalId(initialGoalId);
      setCurrentView('detail');
      onWizardStateChange?.(false);
    }
  }, [initialGoalId, onWizardStateChange]);

  const handleNavigate = (view: string, data?: any) => {
    switch (view) {
      case 'goal-detail':
        setSelectedGoalId(data);
        setCurrentView('detail');
        onWizardStateChange?.(false);
        break;
      case 'create-goal':
        setCurrentView('create-wizard');
        onWizardStateChange?.(true);
        break;
      case 'view-proposals':
        setCurrentView('proposals');
        onWizardStateChange?.(false);
        break;
      case 'goals-list':
      default:
        setCurrentView('list');
        setSelectedGoalId(null);
        setRefreshTrigger(prev => prev + 1); // Trigger refresh
        onWizardStateChange?.(false);
        break;
    }
  };

  const handleCategorySelected = (category: string) => {
    setSelectedCategory(category);
    setCurrentView('create');
    onWizardStateChange?.(false);
  };

  const handleAiGoalCreated = (goal: any) => {
    setAiGoal(goal);
    setCurrentView('summary');
  };

  const handleWizardGoalCreated = (goalData?: any) => {
    setRefreshTrigger(prev => prev + 1);
    
    // If goalId is provided, navigate to goal detail
    if (goalData?.goalId) {
      handleNavigate('goal-detail', goalData.goalId);
    } else {
      // Fallback to list view
      setCurrentView('list');
    }
    
    onWizardStateChange?.(false);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'detail':
        return selectedGoalId ? (
          <GoalDetailV2 
            goalId={selectedGoalId} 
            onBack={() => handleNavigate('goals-list')}
          />
        ) : (
          <GoalsList onNavigate={handleNavigate} refreshTrigger={refreshTrigger} />
        );
      case 'categories':
        return (
          <GoalCategories 
            onSelectCategory={handleCategorySelected}
            onBack={() => setCurrentView('list')}
          />
        );
      case 'create':
        return selectedCategory ? (
          <LuneAISession 
            category={selectedCategory} 
            onBack={() => setCurrentView('categories')} 
            onGoalCreated={handleAiGoalCreated}
          />
        ) : (
          <GoalsList onNavigate={handleNavigate} refreshTrigger={refreshTrigger} />
        );
      case 'summary':
        return aiGoal ? (
          <GoalSummary 
            goal={aiGoal} 
            onBack={() => setCurrentView('list')}
            onComplete={() => setCurrentView('list')}
          />
        ) : (
          <GoalsList onNavigate={handleNavigate} refreshTrigger={refreshTrigger} />
        );
      case 'wizard':
        return (
          <GoalsWizard 
            onComplete={handleWizardGoalCreated}
            onBack={() => {
              setCurrentView('list');
              onWizardStateChange?.(false);
            }}
          />
        );
      case 'create-wizard':
        return (
          <RedesignedGoalsWizard 
            onComplete={handleWizardGoalCreated}
            onCancel={() => {
              setCurrentView('list');
              onWizardStateChange?.(false);
            }}
            isSupporter={userContext?.userType === 'supporter' || userContext?.userType === 'hybrid' || userContext?.userType === 'admin'}
          />
        );
      case 'create-wizard-supporter':
        return (
          <RedesignedGoalsWizard
            onComplete={handleWizardGoalCreated}
            onCancel={() => {
              setCurrentView('list');
              onWizardStateChange?.(false);
            }}
            isSupporter={true}
          />
        );
      case 'supporter-wizard':
        return (
          <SupporterGoalWizard
            onComplete={handleWizardGoalCreated}
            onCancel={() => {
              setCurrentView('list');
              onWizardStateChange?.(false);
            }}
          />
        );
      case 'proposals':
        return (
          <GoalProposalsView 
            onBack={() => setCurrentView('list')}
          />
        );
      case 'list':
      default:
        return <GoalsList onNavigate={handleNavigate} refreshTrigger={refreshTrigger} />;
    }
  };

  // Check if we're in a wizard view
  const isWizardView = currentView === 'create-wizard' || currentView === 'create-wizard-supporter' || currentView === 'supporter-wizard' || currentView === 'wizard';
  
  // Show tabs for supporters and hybrids (but not in wizard views)
  const showTabs = (userContext?.userType === 'supporter' || userContext?.userType === 'hybrid' || userContext?.userType === 'admin') 
    && supporterContext?.supportedIndividuals?.length > 0 
    && !isWizardView;

  if (showTabs) {
    const supportedIndividual = supporterContext.supportedIndividuals[0];
    
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'own' | 'individual')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="own" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Your Goals
              </TabsTrigger>
              <TabsTrigger value="individual" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {supportedIndividual.name}'s Goals
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="own" className="mt-0">
              <div key="own-goals">
                {renderCurrentView()}
              </div>
            </TabsContent>
            
            <TabsContent value="individual" className="mt-0">
              <div key="individual-goals">
                {renderCurrentView()}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {renderCurrentView()}
    </div>
  );
};