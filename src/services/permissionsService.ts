import { supabase } from '@/integrations/supabase/client';

export type PermissionLevel = 'viewer' | 'collaborator';
export type UserRole = 'individual' | 'supporter' | 'friend' | 'provider';
export type AccountStatus = 'active' | 'pending_user_consent' | 'user_claimed';

export interface UserConsent {
  id: string;
  individual_id: string;
  admin_id: string;
  consent_type: string;
  granted: boolean;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Supporter {
  id: string;
  individual_id: string;
  supporter_id: string;
  role: UserRole;
  permission_level: PermissionLevel;
  specific_goals: string[];
  is_admin: boolean;
  is_provisioner: boolean;
  invited_by?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminActionLog {
  id: string;
  admin_user_id: string;
  individual_id: string;
  action_type: string;
  target_user_id?: string;
  target_goal_id?: string;
  details?: any; // Changed from Record<string, any> to any for compatibility
  created_at: string;
}

export interface AccountClaim {
  id: string;
  individual_id: string;
  provisioner_id: string;
  first_name?: string;
  claim_token: string;
  invitee_email?: string;
  magic_link_token?: string;
  magic_link_expires_at?: string;
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
    goalId?: string,
    scope?: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('check_user_permission_v2', {
        _individual_id: individualId,
        _action: action,
        _goal_id: goalId,
        _scope: scope
      });
      
      if (error) throw error;
      return data || false;
    } catch (error) {
      console.error('Permission check failed:', error);
      return false;
    }
  }

  // Get user's supporters - with type assertion to handle DB migration period
  static async getSupporters(individualId: string): Promise<Supporter[]> {
    const { data, error } = await supabase
      .from('supporters')
      .select('*')
      .eq('individual_id', individualId);
    
    if (error) throw error;
    return (data || []).map(supporter => ({
      ...supporter,
      // Handle migration period where old data might still have 'admin' values
      role: (supporter.role as any) === 'admin' ? 'supporter' as UserRole : supporter.role as UserRole,
      permission_level: (supporter.permission_level as any) === 'admin' ? 'collaborator' as PermissionLevel : supporter.permission_level as PermissionLevel,
      is_admin: supporter.is_admin || (supporter.role as any) === 'admin' || (supporter.permission_level as any) === 'admin'
    })) as Supporter[];
  }

  // Add a supporter - with type compatibility handling
  static async addSupporter(supporter: Omit<Supporter, 'id' | 'created_at' | 'updated_at'>): Promise<Supporter> {
    const { data, error } = await supabase
      .from('supporters')
      .insert({
        ...supporter,
        // Clean input during migration period
        role: supporter.role,
        permission_level: supporter.permission_level
      })
      .select()
      .single();
    
    if (error) throw error;
    return {
      ...data,
      role: (data.role as any) === 'admin' ? 'supporter' as UserRole : data.role as UserRole,
      permission_level: (data.permission_level as any) === 'admin' ? 'collaborator' as PermissionLevel : data.permission_level as PermissionLevel,
      is_admin: data.is_admin || (data.role as any) === 'admin' || (data.permission_level as any) === 'admin'
    } as Supporter;
  }

  // Update supporter permissions - with type compatibility
  static async updateSupporterPermissions(
    supporterId: string, 
    updates: Partial<Pick<Supporter, 'permission_level' | 'specific_goals' | 'is_admin'>>
  ): Promise<Supporter> {
    const { data, error } = await supabase
      .from('supporters')
      .update(updates)
      .eq('id', supporterId)
      .select()
      .single();
    
    if (error) throw error;
    return {
      ...data,
      role: data.role === 'admin' ? 'supporter' : data.role,
      permission_level: data.permission_level === 'admin' ? 'collaborator' : data.permission_level,
      is_admin: data.is_admin || data.role === 'admin' || data.permission_level === 'admin'
    } as Supporter;
  }

  // Remove supporter
  static async removeSupporter(supporterId: string): Promise<void> {
    const { error } = await supabase
      .from('supporters')
      .delete()
      .eq('id', supporterId);
    
    if (error) throw error;
  }

  // Create supporter invite using secure database function to bypass RLS
  static async createSupporterInvite(invite: Omit<SupporterInvite, 'id' | 'created_at' | 'status' | 'invite_token'>): Promise<SupporterInvite> {
    console.group('🔄 Creating Supporter Invite (Secure)');
    console.log('Invite data:', invite);

    try {
      const { data, error } = await supabase.rpc('create_supporter_invite_secure', {
        p_individual_id: invite.individual_id,
        p_invitee_email: invite.invitee_email,
        p_invitee_name: invite.invitee_name,
        p_role: invite.role,
        p_permission_level: invite.permission_level,
        p_specific_goals: invite.specific_goals,
        p_message: invite.message,
        p_expires_at: invite.expires_at
      });
      
      if (error) {
        console.error('❌ Database function error creating invite:', error);
        console.groupEnd();
        throw new Error(`Failed to create supporter invite: ${error.message}`);
      }

      if (!data || data.length === 0) {
        console.error('❌ No data returned from function');
        console.groupEnd();
        throw new Error('No data returned from supporter invite creation');
      }

      const inviteRecord = data[0];
      console.log('✅ Invite created successfully via secure function:', inviteRecord);
      console.groupEnd();
      
      return {
        ...inviteRecord,
        role: inviteRecord.role as UserRole,
        permission_level: inviteRecord.permission_level as PermissionLevel
      } as SupporterInvite;
    } catch (err) {
      console.error('❌ Exception in createSupporterInvite:', err);
      console.groupEnd();
      throw err;
    }
  }

  // Accept supporter invite using secure function with fallback and clearer errors
  static async acceptSupporterInvite(inviteToken: string): Promise<void> {
    // Try primary function
    const attempt = async (fn: 'accept_invite_by_token' | 'accept_supporter_invite_secure') => {
      const params = fn === 'accept_invite_by_token'
        ? { _token: inviteToken }
        : { _invite_token: inviteToken };
      const { data, error } = await supabase.rpc(fn, params as any);

      if (error) {
        // Handle specific error cases more gracefully
        if (error.message?.includes('already accepted') || error.message?.includes('already exists')) {
          console.log('Invitation already accepted, this is expected behavior');
          return;
        }
        throw new Error(error.message || 'Invitation acceptance failed');
      }

      const response = data as { success: boolean; error?: string; message?: string };
      if (!response?.success) {
        // Handle "already accepted" case gracefully
        if (response?.error?.includes('already accepted') || response?.error?.includes('already exists')) {
          console.log('Invitation already accepted, this is expected behavior');
          return;
        }
        throw new Error(response?.error || 'Failed to accept invite');
      }
    };

    try {
      await attempt('accept_invite_by_token');
      return;
    } catch (errPrimary) {
      // Check if it's an "already accepted" error
      if (errPrimary instanceof Error && (
          errPrimary.message.includes('already accepted') || 
          errPrimary.message.includes('already exists')
      )) {
        console.log('Invitation already accepted, no action needed');
        return;
      }
      
      console.warn('accept_invite_by_token failed, trying fallback:', errPrimary);
      // Fallback
      await attempt('accept_supporter_invite_secure');
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
      console.log('🔍 Attempting to claim account:', { 
        claimToken, 
        passcode: passcode.substring(0,2) + '****',
        passcodeLength: passcode.length 
      });
      
      const { data, error } = await supabase.rpc('claim_account', {
        _claim_token: claimToken,
        _passcode: passcode
      });
      
      console.log('🔍 Claim account response:', { data, error });
      
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

  // User consent management
  static async grantConsent(
    individualId: string,
    adminId: string,
    consentType: string,
    expiresAt?: string
  ): Promise<UserConsent> {
    const { data, error } = await supabase
      .from('user_consents')
      .upsert({
        individual_id: individualId,
        admin_id: adminId,
        consent_type: consentType,
        granted: true,
        expires_at: expiresAt
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async revokeConsent(
    individualId: string,
    adminId: string,
    consentType: string
  ): Promise<void> {
    const { error } = await supabase
      .from('user_consents')
      .update({ granted: false })
      .eq('individual_id', individualId)
      .eq('admin_id', adminId)
      .eq('consent_type', consentType);
    
    if (error) throw error;
  }

  static async getConsents(individualId: string): Promise<UserConsent[]> {
    const { data, error } = await supabase
      .from('user_consents')
      .select('*')
      .eq('individual_id', individualId);
    
    if (error) throw error;
    return data || [];
  }

  // Admin action logging
  static async logAdminAction(
    individualId: string,
    actionType: string,
    targetUserId?: string,
    targetGoalId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    const { error } = await supabase
      .from('admin_action_log')
      .insert({
        admin_user_id: (await supabase.auth.getUser()).data.user?.id,
        individual_id: individualId,
        action_type: actionType,
        target_user_id: targetUserId,
        target_goal_id: targetGoalId,
        details
      });
    
    if (error) throw error;
  }

  static async getAdminActionLogs(individualId: string): Promise<AdminActionLog[]> {
    const { data, error } = await supabase
      .from('admin_action_log')
      .select('*')
      .eq('individual_id', individualId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(log => ({
      ...log,
      details: log.details || {}
    })) as AdminActionLog[];
  }

  // Check if user is admin for individual
  static async isAdmin(individualId: string, userId?: string): Promise<boolean> {
    const currentUserId = userId || (await supabase.auth.getUser()).data.user?.id;
    if (!currentUserId) return false;

    // User is admin of themselves
    if (currentUserId === individualId) return true;

    const { data, error } = await supabase
      .from('supporters')
      .select('is_admin')
      .eq('individual_id', individualId)
      .eq('supporter_id', currentUserId)
      .single();
    
    if (error) return false;
    return data?.is_admin || false;
  }

  // Get all admins for an individual - with type compatibility
  static async getAdmins(individualId: string): Promise<Supporter[]> {
    const { data, error } = await supabase
      .from('supporters')
      .select('*')
      .eq('individual_id', individualId)
      .eq('is_admin', true);
    
    if (error) throw error;
    return (data || []).map(supporter => ({
      ...supporter,
      role: supporter.role === 'admin' ? 'supporter' : supporter.role,
      permission_level: supporter.permission_level === 'admin' ? 'collaborator' : supporter.permission_level,
      is_admin: true
    })) as Supporter[];
  }
}