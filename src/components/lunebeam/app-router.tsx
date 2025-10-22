import React from 'react';
import { useStore } from '@/store/useStore';
import { OnboardingFlow } from './onboarding-flow';
import { BottomTabs } from '../navigation/bottom-tabs';
import { Home, Target, Users, User } from 'lucide-react';
import lunabeamLogo from '@/assets/lunabeam-logo.png';
import Lottie from 'lottie-react';
import loadingLunaAnimation from '@/assets/loading-luna-animation.json';

const AppRouter: React.FC = () => {
  const { isOnboardingComplete, profile, loadProfile } = useStore();
  const [profileLoaded, setProfileLoaded] = React.useState(false);
  const [showPostOnboardingAnimation, setShowPostOnboardingAnimation] = React.useState(false);
  const [showPostOnboardingSkeleton, setShowPostOnboardingSkeleton] = React.useState(false);
  const onboardingCompleteRef = React.useRef(isOnboardingComplete());

  // Load profile on component mount
  React.useEffect(() => {
    const loadUserProfile = async () => {
      console.log('AppRouter: Loading profile...');
      try {
        await loadProfile();
        const currentProfile = useStore.getState().profile;
        console.log('AppRouter: Profile loaded:', currentProfile);
        
        // For new users, ensure we have a valid profile before proceeding
        if (!currentProfile) {
          console.log('AppRouter: No profile after load attempt, creating minimal profile...');
          // This should have been handled in loadProfile, but let's ensure it worked
          setTimeout(() => {
            const retryProfile = useStore.getState().profile;
            console.log('AppRouter: Profile after retry:', retryProfile);
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

  // Detect when onboarding completes and trigger post-onboarding animation
  React.useEffect(() => {
    const wasOnboarding = !onboardingCompleteRef.current;
    const isNowComplete = isOnboardingComplete();
    
    if (wasOnboarding && isNowComplete) {
      console.log('AppRouter: Onboarding just completed, showing transition animation');
      setShowPostOnboardingAnimation(true);
      
      // Show animation for 2 seconds
      setTimeout(() => {
        setShowPostOnboardingAnimation(false);
        setShowPostOnboardingSkeleton(true);
        
        // Show skeleton for 1 second
        setTimeout(() => {
          setShowPostOnboardingSkeleton(false);
        }, 1000);
      }, 2000);
    }
    
    onboardingCompleteRef.current = isNowComplete;
  }, [isOnboardingComplete]);

  console.log('AppRouter render:', {
    profileLoaded,
    profile,
    onboardingComplete: isOnboardingComplete(),
    showPostOnboardingAnimation,
    showPostOnboardingSkeleton
  });

  // Show loading skeleton until profile is checked
  if (!profileLoaded) {
    console.log('AppRouter: Showing loading skeleton...');
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header with Logo */}
        <div className="flex items-center justify-center p-4 border-b bg-card/80 backdrop-blur">
          <img 
            src={lunabeamLogo} 
            alt="LunaBeam" 
            className="h-8"
          />
        </div>

        {/* Grey Empty Body */}
        <div className="flex-1 bg-muted/30 pb-20">
          {/* Empty grey area */}
        </div>

        {/* Bottom Navigation Tabs Skeleton */}
        <div className="fixed bottom-0 left-0 right-0 bg-card backdrop-blur border-t shadow-[0_-4px_12px_rgba(0,0,0,0.1)]">
          <div className="flex items-center justify-around px-2 py-2">
            {[
              { label: 'Home', Icon: Home },
              { label: 'Goals', Icon: Target },
              { label: 'Community', Icon: Users },
              { label: 'You', Icon: User }
            ].map(({ label, Icon }) => (
              <div
                key={label}
                className="flex flex-col items-center justify-center min-w-0 flex-1 py-2 px-1 rounded-lg text-muted-foreground"
              >
                <Icon className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium truncate">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show onboarding if not completed
  if (!isOnboardingComplete()) {
    console.log('AppRouter: Showing onboarding flow');
    return <OnboardingFlow />;
  }

  // Show post-onboarding animation
  if (showPostOnboardingAnimation) {
    console.log('AppRouter: Showing post-onboarding animation');
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <Lottie
            animationData={loadingLunaAnimation}
            loop={true}
            style={{ width: '150vmax', height: '150vmax' }}
          />
        </div>
      </div>
    );
  }

  // Show post-onboarding skeleton
  if (showPostOnboardingSkeleton) {
    console.log('AppRouter: Showing post-onboarding skeleton');
    return (
      <div className="min-h-screen bg-background flex flex-col animate-fade-in">
        {/* Header with Logo */}
        <div className="flex items-center justify-center p-4 border-b bg-card/80 backdrop-blur">
          <img 
            src={lunabeamLogo} 
            alt="LunaBeam" 
            className="h-8"
          />
        </div>

        {/* Grey Empty Body */}
        <div className="flex-1 bg-muted/30 pb-20">
          {/* Empty grey area */}
        </div>

        {/* Bottom Navigation Tabs Skeleton */}
        <div className="fixed bottom-0 left-0 right-0 bg-card backdrop-blur border-t shadow-[0_-4px_12px_rgba(0,0,0,0.1)]">
          <div className="flex items-center justify-around px-2 py-2">
            {[
              { label: 'Home', Icon: Home },
              { label: 'Goals', Icon: Target },
              { label: 'Community', Icon: Users },
              { label: 'You', Icon: User }
            ].map(({ label, Icon }) => (
              <div
                key={label}
                className="flex flex-col items-center justify-center min-w-0 flex-1 py-2 px-1 rounded-lg text-muted-foreground"
              >
                <Icon className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium truncate">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  console.log('AppRouter: Showing main navigation');
  // Show main app with bottom tabs navigation
  return <BottomTabs />;
};

export { AppRouter };