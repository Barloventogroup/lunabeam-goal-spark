import React, { useState } from 'react';
import { OnboardingRoleSelection } from './onboarding-role-selection';
import { OnboardingConversation } from './onboarding-conversation';

export function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState<'role' | 'conversation'>('role');
  const [roleData, setRoleData] = useState<{ role: 'parent' | 'individual'; individualEmail?: string } | null>(null);

  const handleRoleComplete = (data: { role: 'parent' | 'individual'; individualEmail?: string }) => {
    setRoleData(data);
    setCurrentStep('conversation');
  };

  const handleConversationComplete = () => {
    // This will be handled by the app router automatically
    // since the user's onboarding will be marked as complete
  };

  switch (currentStep) {
    case 'role':
      return <OnboardingRoleSelection onComplete={handleRoleComplete} />;
    
    case 'conversation':
      return (
        <OnboardingConversation 
          roleData={roleData!} 
          onComplete={handleConversationComplete} 
        />
      );
    
    default:
      return <OnboardingRoleSelection onComplete={handleRoleComplete} />;
  }
}