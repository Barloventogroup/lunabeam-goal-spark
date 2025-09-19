import React from 'react';
import { StructuredOnboarding } from './structured-onboarding';
import { ParentOnboarding } from './parent-onboarding';

interface OnboardingConversationProps {
  roleData: { role: 'parent' | 'individual'; isAdmin?: boolean; adminName?: string; adminRole?: string };
  onComplete: () => void;
}

export function OnboardingConversation({ roleData, onComplete }: OnboardingConversationProps) {
  // Use parent-specific onboarding flow for parents with dual profile setup
  if (roleData.role === 'parent') {
    return <ParentOnboarding onComplete={onComplete} adminData={{ name: roleData.adminName, role: roleData.adminRole }} />;
  }
  
  // Use regular onboarding for individuals
  return <StructuredOnboarding onComplete={onComplete} roleData={roleData} />;
}