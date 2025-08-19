import React from 'react';
import { useStore } from '@/store/useStore';
import { OnboardingFlow } from './onboarding-flow';
import { BottomTabs } from '../navigation/bottom-tabs';

const AppRouter: React.FC = () => {
  const { isOnboardingComplete, profile, loadProfile } = useStore();
  const [profileLoaded, setProfileLoaded] = React.useState(false);

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

  console.log('AppRouter: Showing main navigation');
  // Show main app with bottom tabs navigation
  return <BottomTabs />;
};

export { AppRouter };