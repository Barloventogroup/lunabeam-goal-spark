import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { OnboardingFlow } from './onboarding-flow';
import { HomeDashboard } from './home-dashboard';
import { GoalWizard } from './goal-wizard';
import { AIChat } from './ai-chat';
import type { SelectedGoal } from '@/types';

const AppRouter: React.FC = () => {
  const { isOnboardingComplete } = useStore();
  const [currentView, setCurrentView] = useState<string>('home');
  const [viewData, setViewData] = useState<any>(null);

  const handleNavigate = (view: string, data?: any) => {
    setCurrentView(view);
    setViewData(data);
  };

  // Show onboarding if not completed
  if (!isOnboardingComplete()) {
    return <OnboardingFlow />;
  }

  // Main app navigation
  switch (currentView) {
    case 'home':
      return <HomeDashboard onNavigate={handleNavigate} />;
    
    case 'goal-wizard':
      return <GoalWizard onNavigate={handleNavigate} onComplete={() => handleNavigate('home')} />;
    
    case 'goal-detail':
      return (
        <div className="min-h-screen bg-gradient-soft p-4">
          <div className="max-w-md mx-auto py-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Goal Detail</h1>
              <p className="text-foreground-soft mb-6">Coming soon! Goal detail view with tabs for Plan, Check-ins, Evidence, and History.</p>
              <button 
                onClick={() => handleNavigate('home')}
                className="text-primary hover:underline"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </div>
      );
    
    case 'check-in':
      return (
        <div className="min-h-screen bg-gradient-soft p-4">
          <div className="max-w-md mx-auto py-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Check-In</h1>
              <p className="text-foreground-soft mb-6">Coming soon! Check-in flow with progress tracking and optional reflection.</p>
              <button 
                onClick={() => handleNavigate('home')}
                className="text-primary hover:underline"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </div>
      );
    
    case 'supporters':
      return (
        <div className="min-h-screen bg-gradient-soft p-4">
          <div className="max-w-md mx-auto py-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Supporters & Consent</h1>
              <p className="text-foreground-soft mb-6">Coming soon! Manage who can see your progress and adjust privacy settings.</p>
              <button 
                onClick={() => handleNavigate('home')}
                className="text-primary hover:underline"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </div>
      );
    
    case 'evidence':
      return (
        <div className="min-h-screen bg-gradient-soft p-4">
          <div className="max-w-md mx-auto py-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Evidence Gallery</h1>
              <p className="text-foreground-soft mb-6">Coming soon! View all your photos, videos, and documents.</p>
              <button 
                onClick={() => handleNavigate('home')}
                className="text-primary hover:underline"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </div>
      );
    
    case 'badges':
      return (
        <div className="min-h-screen bg-gradient-soft p-4">
          <div className="max-w-md mx-auto py-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Rewards & Badges</h1>
              <p className="text-foreground-soft mb-6">Coming soon! View all your earned badges and achievements.</p>
              <button 
                onClick={() => handleNavigate('home')}
                className="text-primary hover:underline"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </div>
      );
    
    case 'profile':
      return (
        <div className="min-h-screen bg-gradient-soft p-4">
          <div className="max-w-md mx-auto py-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Profile & Settings</h1>
              <p className="text-foreground-soft mb-6">Coming soon! Edit your profile, strengths, interests, and safety plan.</p>
              <button 
                onClick={() => handleNavigate('home')}
                className="text-primary hover:underline"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </div>
      );
    
    case 'ai-chat':
      return (
        <div className="min-h-screen bg-gradient-soft p-4">
          <div className="max-w-md mx-auto py-6 space-y-4">
            <div className="text-center">
              <button 
                onClick={() => handleNavigate('home')}
                className="text-primary hover:underline mb-4"
              >
                ← Back to Home
              </button>
            </div>
            <AIChat context="general" />
          </div>
        </div>
      );

    case 'family-circle-detail':
      return (
        <div className="min-h-screen bg-gradient-soft p-4">
          <div className="max-w-md mx-auto py-6">
            <div className="text-center">
              <button 
                onClick={() => handleNavigate('home')}
                className="text-primary hover:underline mb-4"
              >
                ← Back to Home
              </button>
              <h1 className="text-2xl font-bold mb-4">
                {viewData?.name || 'Family Circle'}
              </h1>
              <p className="text-foreground-soft mb-6">
                Coming soon! Manage your family circle, invite members, and share progress.
              </p>
            </div>
          </div>
        </div>
      );
    
    default:
      return <HomeDashboard onNavigate={handleNavigate} />;
  }
};

export { AppRouter };