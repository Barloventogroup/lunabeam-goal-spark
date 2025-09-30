import { supabase } from '@/integrations/supabase/client';
import { getSupporterContext } from './supporterUtils';

export interface OwnerOption {
  id: string;
  name: string;
  type: 'self' | 'individual';
}

/**
 * Gets available goal creation options for the current user
 */
export async function getAvailableOwners(): Promise<OwnerOption[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const supporterContext = await getSupporterContext(user.id);
    const owners: OwnerOption[] = [];

    // Always include self as an option
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name')
      .eq('user_id', user.id)
      .single();

    owners.push({
      id: user.id,
      name: profile?.first_name || 'You',
      type: 'self'
    });

    // Add supported individuals if user is a supporter
    if (supporterContext.supportedIndividuals.length > 0) {
      supporterContext.supportedIndividuals.forEach(individual => {
        owners.push({
          id: individual.id,
          name: individual.name,
          type: 'individual'
        });
      });
    }

    return owners;
  } catch (error) {
    console.error('Error getting available owners:', error);
    return [];
  }
}

/**
 * Gets the default owner based on user context
 */
export async function getDefaultOwner(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const supporterContext = await getSupporterContext(user.id);
    
    // For supporter-only users, default to the first individual they support
    if (supporterContext.isSupporterOnly && supporterContext.supportedIndividuals.length > 0) {
      return supporterContext.supportedIndividuals[0].id;
    }

    // For everyone else, default to self
    return user.id;
  } catch (error) {
    console.error('Error getting default owner:', error);
    return null;
  }
}