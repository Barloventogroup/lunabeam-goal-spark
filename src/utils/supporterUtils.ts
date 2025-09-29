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
 * Gets supporter invitation details by token (works for unauthenticated users)
 */
export async function getSupporterInviteByToken(token: string) {
  try {
    // Use public RPC that bypasses RLS for unauthenticated access
    const { data, error } = await supabase
      .rpc('get_supporter_invite_public', { p_token: token })
      .maybeSingle();

    if (error) {
      console.error('Error fetching supporter invite via RPC:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching supporter invite:', error);
    return null;
  }
}