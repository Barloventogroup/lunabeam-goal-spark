import React, { useState } from 'react';
import { GoalCategories } from './goal-categories';
import { LuneAISession } from './lune-ai-session';
import { GoalSummary } from './goal-summary';

interface ExtractedGoal {
  title: string;
  description: string;
  category: string;
  steps: string[];
  timeEstimate: string;
}

interface GoalWizardProps {
  onNavigate?: (view: string) => void;
  onComplete?: () => void;
}

export const GoalWizard: React.FC<GoalWizardProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState<'categories' | 'session' | 'summary'>('categories');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [extractedGoal, setExtractedGoal] = useState<ExtractedGoal | null>(null);

  const handleSelectCategory = (category: string) => {
    setSelectedCategory(category);
    setCurrentStep('session');
  };

  const handleGoalCreated = (goal: ExtractedGoal) => {
    setExtractedGoal(goal);
    setCurrentStep('summary');
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'session':
        setCurrentStep('categories');
        break;
      case 'summary':
        setCurrentStep('session');
        break;
      default:
        onComplete?.();
    }
  };

  const handleComplete = () => {
    onComplete?.();
  };

  switch (currentStep) {
    case 'categories':
      return (
        <GoalCategories 
          onSelectCategory={handleSelectCategory}
          onBack={() => onComplete?.()}
        />
      );
    
    case 'session':
      return (
        <LuneAISession 
          category={selectedCategory}
          onBack={handleBack}
          onGoalCreated={handleGoalCreated}
        />
      );
    
    case 'summary':
      return (
        <GoalSummary 
          goal={extractedGoal!}
          onBack={handleBack}
          onComplete={handleComplete}
        />
      );
    
    default:
      return null;
  }
};