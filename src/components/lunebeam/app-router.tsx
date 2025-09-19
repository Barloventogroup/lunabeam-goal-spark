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
        const currentProfile = useStore.getState().profile;
        console.log('AppRouter: Profile loaded:', currentProfile);
        console.log('AppRouter: Profile onboarding_complete:', currentProfile?.onboarding_complete);
        
        // For new users, ensure we have a valid profile before proceeding
        if (!currentProfile) {
          console.log('AppRouter: No profile after load attempt, creating minimal profile...');
          // This should have been handled in loadProfile, but let's ensure it worked
          setTimeout(() => {
            const retryProfile = useStore.getState().profile;
            console.log('AppRouter: Profile after retry:', retryProfile);
            console.log('AppRouter: Retry profile onboarding_complete:', retryProfile?.onboarding_complete);
            setProfileLoaded(true);
          }, 500);
          return;
        }
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
    console.log('AppRouter: Showing onboarding flow - profile onboarding_complete:', profile?.onboarding_complete);
    return <OnboardingFlow />;
  }

  console.log('AppRouter: Showing main navigation');
  // Show main app with bottom tabs navigation
  return <BottomTabs />;
};

export { AppRouter };