import React, { useState } from 'react';
import { GoalsList } from '../lunebeam/goals-list';
import { GoalDetail } from '../lunebeam/goal-detail';
import { CreateGoal } from '../lunebeam/create-goal';

type GoalsView = 'list' | 'detail' | 'create';

export const TabGoals: React.FC = () => {
  const [currentView, setCurrentView] = useState<GoalsView>('list');
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  const handleNavigate = (view: string, data?: any) => {
    switch (view) {
      case 'goal-detail':
        setSelectedGoalId(data);
        setCurrentView('detail');
        break;
      case 'create-goal':
        setCurrentView('create');
        break;
      case 'goals-list':
      default:
        setCurrentView('list');
        setSelectedGoalId(null);
        break;
    }
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
      case 'create':
        return <CreateGoal onNavigate={handleNavigate} />;
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