import React from 'react';
import { SupporterHomeDashboard } from '@/components/supporter/supporter-home-dashboard';

interface TabSupporterHomeProps {
  onNavigateToGoals: (individualId?: string) => void;
  onNavigateToIndividual: (individualId: string) => void;
}

export const TabSupporterHome: React.FC<TabSupporterHomeProps> = ({
  onNavigateToGoals,
  onNavigateToIndividual
}) => {
  return (
    <SupporterHomeDashboard 
      onNavigateToGoals={onNavigateToGoals}
      onNavigateToIndividual={onNavigateToIndividual}
    />
  );
};