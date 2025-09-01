import React, { useState } from 'react';
import { GoalsList } from '../lunebeam/goals-list';
import { GoalDetail } from '../lunebeam/goal-detail';
import { LuneAISession } from '../lunebeam/lune-ai-session';
import { GoalSummary } from '../lunebeam/goal-summary';
import { GoalCategories } from '../lunebeam/goal-categories';
import { GoalsWizard } from '../lunebeam/goals-wizard';

type GoalsView = 'list' | 'detail' | 'categories' | 'create' | 'summary' | 'wizard';

interface TabGoalsProps {
  onWizardStateChange?: (isWizardActive: boolean) => void;
}

export const TabGoals: React.FC<TabGoalsProps> = ({ onWizardStateChange }) => {
  const [currentView, setCurrentView] = useState<GoalsView>('list');
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [aiGoal, setAiGoal] = useState<any>(null);

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
      case 'goals-list':
      default:
        setCurrentView('list');
        setSelectedGoalId(null);
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

  const handleWizardGoalCreated = (goalData: any) => {
    setAiGoal(goalData);
    setCurrentView('summary');
    onWizardStateChange?.(false);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'detail':
        return selectedGoalId ? (
          <GoalDetail 
            goalId={selectedGoalId} 
            onNavigate={handleNavigate}
          />
        ) : (
          <GoalsList onNavigate={handleNavigate} />
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
          <GoalsList onNavigate={handleNavigate} />
        );
      case 'summary':
        return aiGoal ? (
          <GoalSummary 
            goal={aiGoal} 
            onBack={() => setCurrentView('list')}
            onComplete={() => setCurrentView('list')}
          />
        ) : (
          <GoalsList onNavigate={handleNavigate} />
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
      case 'list':
      default:
        return <GoalsList onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {renderCurrentView()}
    </div>
  );
};