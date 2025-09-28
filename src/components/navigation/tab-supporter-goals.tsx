import React from 'react';
import { SupporterGoalsView } from '@/components/supporter/supporter-goals-view';

interface TabSupporterGoalsProps {
  selectedIndividualId?: string;
}

export const TabSupporterGoals: React.FC<TabSupporterGoalsProps> = ({
  selectedIndividualId
}) => {
  return (
    <SupporterGoalsView selectedIndividualId={selectedIndividualId} />
  );
};