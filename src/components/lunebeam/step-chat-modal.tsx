import React from 'react';
import { LunaChatScreen } from './luna-chat-screen';
import type { Step, Goal } from '@/types';

interface StepChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  step: Step | null;
  goal: Goal | null;
  onStepsUpdate?: (newSteps: Step[]) => void;
  onStepsChange?: () => void;
  onOpenSubstepDrawer?: (stepId: string) => void;
}

export const StepChatModal: React.FC<StepChatModalProps> = (props) => {
  return <LunaChatScreen {...props} />;
};