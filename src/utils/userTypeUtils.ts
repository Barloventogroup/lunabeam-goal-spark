import { Profile } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { getEnhancedUserType } from '@/utils/supporterUtils';

export type UserType = 'individual' | 'supporter' | 'hybrid' | 'admin' | 'unknown';

export interface UserContext {
  userType: UserType;
  hasAdminFeatures: boolean;
  profile: Profile | null;
}

/**
 * Determines the user type based on their profile
 */
export async function getUserContext(profile: Profile | null): Promise<UserContext> {
  if (!profile) {
    return {
      userType: 'unknown',
      hasAdminFeatures: false,
      profile,
    };
  }

  // Get enhanced user type that considers supporter relationships
  const enhancedUserType = await getEnhancedUserType(profile);
  const hasAdminFeatures = enhancedUserType === 'admin';

  return {
    userType: enhancedUserType,
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

  // Simplified welcome logic - no more claim distinction

  // Admin/supporter messages
  return {
    title: isFirstTime ? `Welcome ${displayName}!` : `Welcome back, ${displayName}!`,
    subtitle: isFirstTime
      ? "👋 Hey there! Welcome aboard. Let's kick things off by setting your very first goal. Ready to get started?"
      : "Let's keep moving forward, one step at a time.",
  };
}
