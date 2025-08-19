import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { OnboardingFlow } from './onboarding-flow';
import { HomeDashboard } from './home-dashboard';
import { GoalWizard } from './goal-wizard';
import { FamilyCircleCard } from './family-circle-card';
import { WeeklyCheckinModal } from './weekly-checkin-modal';
import { GoalsList } from './goals-list';
import { CreateGoal } from './create-goal';
import { GoalDetail } from './goal-detail';
import { AIChat } from './ai-chat';

const AppRouter: React.FC = () => {
  const { isOnboardingComplete, profile, loadProfile } = useStore();
  const [currentView, setCurrentView] = useState<string>('home');
  const [viewData, setViewData] = useState<any>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Load profile on component mount
  React.useEffect(() => {
    const loadUserProfile = async () => {
      console.log('AppRouter: Loading profile...');
      try {
        await loadProfile();
        console.log('AppRouter: Profile loaded:', useStore.getState().profile);
      } catch (error) {
        console.error('AppRouter: Failed to load profile:', error);
      } finally {
        setProfileLoaded(true);
        console.log('AppRouter: Profile loading complete');
      }
    };
    loadUserProfile();
  }, [loadProfile]);

  const handleNavigate = (view: string, data?: any) => {
    setCurrentView(view);
    setViewData(data);
  };

  console.log('AppRouter render:', {
    profileLoaded,
    profile,
    onboardingComplete: isOnboardingComplete()
  });

  // Show loading until profile is checked
  if (!profileLoaded) {
    console.log('AppRouter: Showing loading...');
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show onboarding if not completed
  if (!isOnboardingComplete()) {
    console.log('AppRouter: Showing onboarding flow');
    return <OnboardingFlow />;
  }

  console.log('AppRouter: Showing main app navigation');

  // Main app navigation
  switch (currentView) {
    case 'home':
      return <HomeDashboard onNavigate={handleNavigate} />;
    
    case 'goal-wizard':
      return <GoalWizard onNavigate={handleNavigate} onComplete={() => handleNavigate('home')} />;
    
    case 'goals-list':
      return <GoalsList onNavigate={handleNavigate} />;
        
    case 'create-goal':
      return <CreateGoal onNavigate={handleNavigate} />;
        
    case 'goal-detail':
      return viewData ? (
        <GoalDetail goalId={viewData} onNavigate={handleNavigate} />
      ) : (
        <GoalsList onNavigate={handleNavigate} />
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