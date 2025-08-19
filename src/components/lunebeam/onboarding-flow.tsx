import React from 'react';
import { OnboardingConversation } from './onboarding-conversation';

export function OnboardingFlow() {
  // Directly render the structured onboarding; removed redundant role selection view
  return <OnboardingConversation roleData={{ role: 'individual' }} onComplete={() => {}} />;
}
