import React, { useState, useEffect } from 'react';
import { GoalsList } from '../lunebeam/goals-list';
import { GoalDetailV2 } from '../lunebeam/goal-detail-v2';
import { LuneAISession } from '../lunebeam/lune-ai-session';
import { GoalSummary } from '../lunebeam/goal-summary';
import { GoalCategories } from '../lunebeam/goal-categories';
import { GoalsWizard } from '../lunebeam/goals-wizard';
import { GoalCreationWizard } from '../lunebeam/goal-creation-wizard';
import { GoalProposalsView } from '../lunebeam/goal-proposals-view';

type GoalsView = 'list' | 'detail' | 'categories' | 'create' | 'summary' | 'wizard' | 'create-wizard' | 'proposals';

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
        setCurrentView('wizard');
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

  const handleWizardGoalCreated = () => {
    setCurrentView('list');
    setRefreshTrigger(prev => prev + 1); // Trigger refresh when new goal created
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
          <GoalCreationWizard 
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

  return (
    <div className="min-h-screen bg-background">
      {renderCurrentView()}
    </div>
  );
};