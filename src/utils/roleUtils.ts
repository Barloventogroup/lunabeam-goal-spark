import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types';

export type UserRole = 'admin' | 'individual' | 'supporter' | 'hybrid';

/**
 * Updates the user's role in their profile
 */
export async function updateUserRole(userId: string, newRole: UserRole): Promise<{ error?: any }> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ user_type: newRole })
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating user role:', error);
      return { error };
    }

    return {};
  } catch (error) {
    console.error('Unexpected error updating user role:', error);
    return { error };
  }
}

/**
 * Gets the user's current role from their profile
 */
export function getUserRole(profile: Profile | null): UserRole {
  return profile?.user_type || 'individual';
}

/**
 * Checks if the user has admin privileges
 */
export function isAdmin(profile: Profile | null): boolean {
  return getUserRole(profile) === 'admin';
}

/**
 * Checks if the user is an individual
 */
export function isIndividual(profile: Profile | null): boolean {
  return getUserRole(profile) === 'individual';
}