import React from 'react';
import { SupporterGoalsView } from '@/components/supporter/supporter-goals-view';

interface TabSupporterGoalsProps {
  selectedIndividualId?: string;
  onNavigate?: (view: string, goalId?: string) => void;
}

export const TabSupporterGoals: React.FC<TabSupporterGoalsProps> = ({
  selectedIndividualId,
  onNavigate
}) => {
  return (
    <SupporterGoalsView 
      selectedIndividualId={selectedIndividualId}
      onNavigate={onNavigate}
    />
  );
};