import React from 'react';
import { Fireworks } from '@/components/ui/fireworks';

interface GoalCompletionCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  goalTitle: string;
}

export const GoalCompletionCelebration: React.FC<GoalCompletionCelebrationProps> = ({
  isOpen,
  onClose,
  goalTitle
}) => {
  return (
    <Fireworks 
      isVisible={isOpen} 
      onComplete={onClose}
    />
  );
};