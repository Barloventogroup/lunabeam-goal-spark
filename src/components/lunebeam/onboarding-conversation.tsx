import React from 'react';
import { StructuredOnboarding } from './structured-onboarding';
import { ParentOnboarding } from './parent-onboarding';

interface OnboardingConversationProps {
  roleData: { role: 'parent' | 'individual'; isAdmin?: boolean };
  onComplete: () => void;
  onExit: () => Promise<void>;
  onBack?: () => void;
}

export function OnboardingConversation({ roleData, onComplete, onExit, onBack }: OnboardingConversationProps) {
  // Use parent-specific onboarding flow for parents with dual profile setup
  if (roleData.role === 'parent') {
    return <ParentOnboarding onComplete={onComplete} onExit={onExit} onBack={onBack} />;
  }
  
  // Use regular onboarding for individuals
  return <StructuredOnboarding onComplete={onComplete} roleData={roleData} onExit={onExit} onBack={onBack} />;
}