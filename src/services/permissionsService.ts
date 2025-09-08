import { supabase } from '@/integrations/supabase/client';

export type PermissionLevel = 'viewer' | 'collaborator' | 'admin';
export type UserRole = 'individual' | 'supporter' | 'friend' | 'provider' | 'admin';
export type AccountStatus = 'active' | 'pending_user_consent' | 'user_claimed';

export interface Supporter {
  id: string;
  individual_id: string;
  supporter_id: string;
  role: UserRole;
  permission_level: PermissionLevel;
  specific_goals: string[];
  is_provisioner: boolean;
  invited_by?: string;
  created_at: string;
  updated_at: string;
}

export interface AccountClaim {
  id: string;
  individual_id: string;
  provisioner_id: string;
  claim_passcode: string;
  claim_token: string;
  expires_at: string;
  claimed_at?: string;
  created_at: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
}

export interface SupporterInvite {
  id: string;
  individual_id: string;
  inviter_id: string;
  invitee_email: string;
  invitee_name?: string;
  role: UserRole;
  permission_level: PermissionLevel;
  specific_goals: string[];
  invite_token: string;
  message?: string;
  expires_at: string;
  created_at: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
}

export class PermissionsService {
  // Check if current user has permission for specific action
  static async checkPermission(
    individualId: string, 
    action: string, 
    goalId?: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('check_user_permission', {
        _individual_id: individualId,
        _action: action,
        _goal_id: goalId
      });
      
      if (error) throw error;
      return data || false;
    } catch (error) {
      console.error('Permission check failed:', error);
      return false;
    }
  }

  // Get user's supporters
  static async getSupporters(individualId: string): Promise<Supporter[]> {
    const { data, error } = await supabase
      .from('supporters')
      .select('*')
      .eq('individual_id', individualId);
    
    if (error) throw error;
    return data || [];
  }

  // Add a supporter
  static async addSupporter(supporter: Omit<Supporter, 'id' | 'created_at' | 'updated_at'>): Promise<Supporter> {
    const { data, error } = await supabase
      .from('supporters')
      .insert(supporter)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Update supporter permissions
  static async updateSupporterPermissions(
    supporterId: string, 
    updates: Partial<Pick<Supporter, 'permission_level' | 'specific_goals'>>
  ): Promise<Supporter> {
    const { data, error } = await supabase
      .from('supporters')
      .update(updates)
      .eq('id', supporterId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Remove supporter
  static async removeSupporter(supporterId: string): Promise<void> {
    const { error } = await supabase
      .from('supporters')
      .delete()
      .eq('id', supporterId);
    
    if (error) throw error;
  }

  // Create supporter invite
  static async createSupporterInvite(invite: Omit<SupporterInvite, 'id' | 'created_at' | 'status' | 'invite_token'>): Promise<SupporterInvite> {
    const inviteToken = crypto.randomUUID();
    
    const { data, error } = await supabase
      .from('supporter_invites')
      .insert({
        ...invite,
        invite_token: inviteToken,
        status: 'pending'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Accept supporter invite using secure function
  static async acceptSupporterInvite(inviteToken: string): Promise<void> {
    const { data, error } = await supabase.rpc('accept_invite_by_token', {
      _token: inviteToken
    });
    
    if (error) throw error;
    
    // Type the response and check if the function returned an error
    const response = data as { success: boolean; error?: string; message?: string };
    if (!response?.success) {
      throw new Error(response?.error || 'Failed to accept invite');
    }
  }

  // Get sent invites using secure function (hides sensitive data)
  static async getSentInvites(): Promise<any[]> {
    const { data, error } = await supabase.rpc('get_my_sent_invites');
    
    if (error) throw error;
    return data || [];
  }

  // Create account claim for on-behalf account creation
  static async createAccountClaim(
    individualId: string, 
    provisionerId: string
  ): Promise<{ claimToken: string; passcode: string }> {
    const claimToken = crypto.randomUUID();
    const passcode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const { error } = await supabase
      .from('account_claims')
      .insert({
        individual_id: individualId,
        provisioner_id: provisionerId,
        claim_token: claimToken,
        claim_passcode: passcode,
        status: 'pending'
      });
    
    if (error) throw error;
    return { claimToken, passcode };
  }

  // Claim account
  static async claimAccount(claimToken: string, passcode: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('claim_account', {
        _claim_token: claimToken,
        _passcode: passcode
      });
      
      if (error) throw error;
      return (data as any)?.success || false;
    } catch (error) {
      console.error('Account claim failed:', error);
      return false;
    }
  }

  // Get account claim by token
  static async getAccountClaim(claimToken: string): Promise<AccountClaim | null> {
    const { data, error } = await supabase
      .from('account_claims')
      .select('*')
      .eq('claim_token', claimToken)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .single();
    
    if (error) return null;
    return data;
  }

  // Check if user is provisioner for an individual
  static async isProvisioner(individualId: string, supporterId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('supporters')
      .select('is_provisioner')
      .eq('individual_id', individualId)
      .eq('supporter_id', supporterId)
      .single();
    
    if (error) return false;
    return data?.is_provisioner || false;
  }

  // Get user's account status
  static async getAccountStatus(userId: string): Promise<AccountStatus> {
    const { data, error } = await supabase
      .from('profiles')
      .select('account_status')
      .eq('user_id', userId)
      .single();
    
    if (error) return 'active';
    return data?.account_status || 'active';
  }
}