import { supabase } from '@/integrations/supabase/client';

export interface SupporterContext {
  isSupporterOnly: boolean;
  isHybrid: boolean;
  supportedIndividuals: Array<{
    id: string;
    name: string;
    role: string;
    permission_level: string;
  }>;
}

/**
 * Determines if a user is a supporter and gets their supporter context
 */
export async function getSupporterContext(userId: string): Promise<SupporterContext> {
  try {
    // Check if user supports anyone
    const { data: supporterRelationships, error: supporterError } = await supabase
      .from('supporters')
      .select(`
        individual_id,
        role,
        permission_level
      `)
      .eq('supporter_id', userId);

    if (supporterError) {
      console.error('Error fetching supporter relationships:', supporterError);
      return {
        isSupporterOnly: false,
        isHybrid: false,
        supportedIndividuals: []
      };
    }

    const supportedIndividuals = [];
    for (const rel of supporterRelationships || []) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name')
        .eq('user_id', rel.individual_id)
        .single();
      
      supportedIndividuals.push({
        id: rel.individual_id,
        name: profile?.first_name || 'User',
        role: rel.role,
        permission_level: rel.permission_level
      });
    }

    // Check if user also has their own goals (hybrid user)
    const { data: ownGoals, error: goalsError } = await supabase
      .from('goals')
      .select('id')
      .eq('owner_id', userId)
      .limit(1);

    if (goalsError) {
      console.error('Error checking own goals:', goalsError);
    }

    const hasOwnGoals = (ownGoals?.length || 0) > 0;
    const isSupporter = supportedIndividuals.length > 0;

    return {
      isSupporterOnly: isSupporter && !hasOwnGoals,
      isHybrid: isSupporter && hasOwnGoals,
      supportedIndividuals
    };

  } catch (error) {
    console.error('Error getting supporter context:', error);
    return {
      isSupporterOnly: false,
      isHybrid: false,
      supportedIndividuals: []
    };
  }
}

/**
 * Enhanced user type detection that considers supporter relationships
 */
export async function getEnhancedUserType(profile: any): Promise<'individual' | 'supporter' | 'hybrid' | 'admin'> {
  if (!profile?.user_id) return 'individual';

  const supporterContext = await getSupporterContext(profile.user_id);

  if (supporterContext.isHybrid) {
    return 'hybrid';
  } else if (supporterContext.isSupporterOnly) {
    return 'supporter';
  } else if (profile.user_type === 'admin') {
    return 'admin';
  } else {
    return 'individual';
  }
}

/**
 * Gets supporter invitation details by token
 */
export async function getSupporterInviteByToken(token: string) {
  try {
    const { data, error } = await supabase
      .from('supporter_invites')
      .select(`
        id,
        individual_id,
        invitee_name,
        role,
        permission_level,
        message,
        supporter_setup_token
      `)
      .eq('supporter_setup_token', token)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) {
      return null;
    }

    // Get individual name separately
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name')
      .eq('user_id', data.individual_id)
      .single();

    return {
      ...data,
      individual_name: profile?.first_name || 'User'
    };
  } catch (error) {
    console.error('Error fetching supporter invite:', error);
    return null;
  }
}