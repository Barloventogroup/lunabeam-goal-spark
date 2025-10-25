import React from 'react';
import { useStore } from '@/store/useStore';
import { OnboardingFlow } from './onboarding-flow';
import { BottomTabs } from '../navigation/bottom-tabs';
import { Home, Target, Users, User } from 'lucide-react';
import Lottie from 'lottie-react';
import loadingLunaAnimation from '@/assets/loading-luna-animation.json';
import { resolveEntryVariant, EntryVariant } from '@/utils/entryExperience';

const AppRouter: React.FC = () => {
  const { isOnboardingComplete, profile, loadProfile, goals } = useStore();
  const [profileLoaded, setProfileLoaded] = React.useState(false);
  const [showPostOnboardingAnimation, setShowPostOnboardingAnimation] = React.useState(false);
  const [showPostOnboardingSkeleton, setShowPostOnboardingSkeleton] = React.useState(false);
  const [entryVariant, setEntryVariant] = React.useState<EntryVariant>('returning');
  const transitionShownRef = React.useRef(false);

  // Load profile on component mount
  const loadingRef = React.useRef(false);
  
  React.useEffect(() => {
    // Only run once on mount - prevent duplicate loads
    if (loadingRef.current) return;
    loadingRef.current = true;
    
    const loadUserProfile = async () => {
      console.log('AppRouter: Loading profile...');
      try {
        await loadProfile();
        const currentProfile = useStore.getState().profile;
        const currentGoals = useStore.getState().goals;
        console.log('AppRouter: Profile loaded:', currentProfile);
        
        // Determine entry variant based on profile and goals
        const activeGoalsCount = currentGoals.filter(g => g.status === 'active' || g.status === 'planned').length;
        const variant = resolveEntryVariant({
          onboardingComplete: currentProfile?.onboarding_complete || false,
          goalsLoaded: true,
          activeGoalsCount
        });
        setEntryVariant(variant);
        console.log('AppRouter: Entry variant determined:', variant);
        
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
        loadingRef.current = false;
        console.log('AppRouter: Profile loading complete');
      }
    };
    loadUserProfile();
  }, []); // Empty array - run only once on mount

  // Detect when onboarding or sign-in completes and trigger animation
  React.useEffect(() => {
    // Prevent showing animation more than once
    if (transitionShownRef.current) return;
    
    // Check if onboarding just completed (flag set by OnboardingFlow)
    const justCompletedOnboarding = sessionStorage.getItem('onboarding-just-completed') === 'true';
    // Check if sign-in just completed (flag set by Auth)
    const justSignedIn = sessionStorage.getItem('sign-in-just-completed') === 'true';
    
    if (justCompletedOnboarding || justSignedIn) {
      console.log('AppRouter: Showing transition animation', {
        justCompletedOnboarding,
        justSignedIn
      });
      
      // Mark that we've shown the transition
      transitionShownRef.current = true;
      
      // Determine variant based on the transition type
      if (justCompletedOnboarding) {
        setEntryVariant('first_time');
      } else if (justSignedIn) {
        // Compute variant from current state for returning users
        const currentGoals = useStore.getState().goals;
        const activeGoalsCount = currentGoals.filter(g => g.status === 'active' || g.status === 'planned').length;
        const variant = resolveEntryVariant({
          onboardingComplete: true, // They signed in, so onboarding is complete
          goalsLoaded: true,
          activeGoalsCount
        });
        setEntryVariant(variant);
      }
      
      // Clear the flags immediately
      sessionStorage.removeItem('onboarding-just-completed');
      sessionStorage.removeItem('sign-in-just-completed');
      
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
  }, [profile?.onboarding_complete, goals]); // Watch profile and goals to trigger when data loads

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
      <div className="min-h-[100dvh] bg-background flex flex-col max-w-full overflow-x-hidden" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 4rem)' }}>
        {/* Header with Logo */}
        <div className="fixed left-0 right-0 top-safe z-40 flex items-center border-b bg-card/80 backdrop-blur px-4 pb-4 pt-4">
          <img
            src="/lovable-uploads/7f6e5283-da38-4bfc-ac26-ae239e843b39.png" 
            alt="Lunabeam logo" 
            className="h-7 w-auto object-contain"
          />
        </div>

        {/* Grey Empty Body */}
        <div className="flex-1 bg-muted/30 pb-20">
          {/* Empty grey area */}
        </div>

        {/* Bottom Navigation Tabs Skeleton */}
        <div className="fixed left-0 right-0 bottom-safe bg-card backdrop-blur border-t shadow-[0_-4px_12px_rgba(0,0,0,0.1)]">
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
      <div className="min-h-[100dvh] bg-background flex flex-col animate-fade-in max-w-full overflow-x-hidden" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 4rem)' }}>
        {/* Header with Logo */}
        <div className="fixed left-0 right-0 top-safe z-40 flex items-center border-b bg-card/80 backdrop-blur px-4 pb-4 pt-4">
          <img
            src="/lovable-uploads/7f6e5283-da38-4bfc-ac26-ae239e843b39.png" 
            alt="Lunabeam logo" 
            className="h-7 w-auto object-contain"
          />
        </div>

        {/* Grey Empty Body */}
        <div className="flex-1 bg-muted/30 pb-20">
          {/* Empty grey area */}
        </div>

        {/* Bottom Navigation Tabs Skeleton */}
        <div className="fixed left-0 right-0 bottom-safe bg-card backdrop-blur border-t shadow-[0_-4px_12px_rgba(0,0,0,0.1)]">
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

  console.log('AppRouter: Showing main navigation', { entryVariant });
  // Show main app with bottom tabs navigation
  return <BottomTabs initialTab="home" entryVariant={entryVariant} />;
};

export { AppRouter };