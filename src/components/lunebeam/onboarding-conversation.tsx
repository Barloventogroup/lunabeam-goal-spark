import React from 'react';
import { StructuredOnboarding } from './structured-onboarding';

interface OnboardingConversationProps {
  roleData: { role: 'parent' | 'individual'; individualEmail?: string };
  onComplete: () => void;
}

export function OnboardingConversation({ roleData, onComplete }: OnboardingConversationProps) {
  return <StructuredOnboarding onComplete={onComplete} />;
}