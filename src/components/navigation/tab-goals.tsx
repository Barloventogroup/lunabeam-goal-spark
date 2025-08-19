import React, { useState } from 'react';
import { GoalsList } from '../lunebeam/goals-list';
import { GoalDetail } from '../lunebeam/goal-detail';
import { AIGoalSession } from '../lunebeam/ai-goal-session';
import { GoalSummary } from '../lunebeam/goal-summary';

type GoalsView = 'list' | 'detail' | 'create' | 'summary';

export const TabGoals: React.FC = () => {
  const [currentView, setCurrentView] = useState<GoalsView>('list');
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [aiGoal, setAiGoal] = useState<any>(null);

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

  const handleAiGoalCreated = (goal: any) => {
    setAiGoal(goal);
    setCurrentView('summary');
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
        return (
          <AIGoalSession 
            category="education" 
            onBack={() => setCurrentView('list')} 
            onGoalCreated={handleAiGoalCreated}
          />
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