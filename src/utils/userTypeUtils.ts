import { Profile } from '@/types';
import { supabase } from '@/integrations/supabase/client';

export type UserType = 'individual' | 'admin' | 'unknown';

export interface UserContext {
  userType: UserType;
  isClaimedIndividual: boolean;
  hasAdminFeatures: boolean;
  profile: Profile | null;
}

/**
 * Determines the user type based on their profile
 */
export async function getUserContext(profile: Profile | null): Promise<UserContext> {
  // Do not require user_id; rely on persisted profile.user_type
  const userType = (profile?.user_type ?? 'unknown') as UserType;
  const isClaimedIndividual = profile?.account_status === 'user_claimed';
  const hasAdminFeatures = userType === 'admin';

  return {
    userType,
    isClaimedIndividual,
    hasAdminFeatures,
    profile,
  };
}

/**
 * Gets a personalized welcome message based on user type
 */
export function getWelcomeMessage(
  userContext: UserContext,
  isFirstTime: boolean
): { title: string; subtitle: string } {
  const displayName = userContext.profile?.first_name
    ? userContext.profile.first_name.charAt(0).toUpperCase() + userContext.profile.first_name.slice(1)
    : 'User';

  if (userContext.isClaimedIndividual) {
    return {
      title: `Welcome, ${displayName}!`,
      subtitle: isFirstTime
        ? "Your support team has set up your goals. Let's continue your journey together!"
        : 'Ready to continue working on your goals? Your support team is here to help.',
    };
  }

  // Admin/supporter messages
  return {
    title: isFirstTime ? `Welcome ${displayName}!` : `Welcome back, ${displayName}!`,
    subtitle: isFirstTime
      ? "👋 Hey there! Welcome aboard. Let's kick things off by setting your very first goal. Ready to get started?"
      : "Let's keep moving forward, one step at a time.",
  };
}
