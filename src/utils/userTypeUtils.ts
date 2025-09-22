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
 * Determines the user type based on their profile and supporter relationships
 */
export async function getUserContext(profile: Profile | null): Promise<UserContext> {
  if (!profile?.user_id) {
    return {
      userType: 'unknown',
      isClaimedIndividual: false,
      hasAdminFeatures: false,
      profile
    };
  }

  // Check if this user is a claimed individual
  const isClaimedIndividual = profile.account_status === 'user_claimed';

  // Check if user has supporters (meaning they're an individual)
  const { data: supporters, error: supportersError } = await supabase
    .from('supporters')
    .select('id')
    .eq('individual_id', profile.user_id)
    .limit(1);

  // Check if user supports others (meaning they're an admin/supporter)
  const { data: individualsSupported, error: individualsError } = await supabase
    .from('supporters')
    .select('id')
    .eq('supporter_id', profile.user_id)
    .limit(1);

  if (supportersError || individualsError) {
    console.error('Error checking user relationships:', { supportersError, individualsError });
  }

  const hasSupporter = supporters && supporters.length > 0;
  const supportsOthers = individualsSupported && individualsSupported.length > 0;

  // Determine user type
  let userType: UserType = 'unknown';
  let hasAdminFeatures = false;

  if (isClaimedIndividual && hasSupporter) {
    // Individual who claimed their account and has supporters
    userType = 'individual';
    hasAdminFeatures = false;
  } else if (supportsOthers && !hasSupporter) {
    // User who supports others but has no supporters = admin
    userType = 'admin';
    hasAdminFeatures = true;
  } else if (supportsOthers && hasSupporter) {
    // User who both supports others and has supporters = admin (mixed role)
    userType = 'admin';
    hasAdminFeatures = true;
  } else {
    // New user with no relationships yet = admin (default)
    userType = 'admin';
    hasAdminFeatures = true;
  }

  return {
    userType,
    isClaimedIndividual,
    hasAdminFeatures,
    profile
  };
}

/**
 * Gets a personalized welcome message based on user type
 */
export function getWelcomeMessage(userContext: UserContext, isFirstTime: boolean): { title: string; subtitle: string } {
  const displayName = userContext.profile?.first_name 
    ? userContext.profile.first_name.charAt(0).toUpperCase() + userContext.profile.first_name.slice(1) 
    : 'User';

  if (userContext.isClaimedIndividual) {
    return {
      title: `Welcome, ${displayName}!`,
      subtitle: isFirstTime 
        ? "Your support team has set up your goals. Let's continue your journey together!"
        : "Ready to continue working on your goals? Your support team is here to help."
    };
  }

  // Admin/supporter messages
  return {
    title: isFirstTime ? `Welcome ${displayName}!` : `Welcome back, ${displayName}!`,
    subtitle: isFirstTime
      ? "👋 Hey there! Welcome aboard. Let's kick things off by setting your very first goal. Ready to get started?"
      : "Let's keep moving forward, one step at a time."
  };
}