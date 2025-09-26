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

// AccountClaim interface removed - using simplified auth flow

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
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'pending_admin_approval';
  requires_approval?: boolean;
  requested_by?: string;
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

  // Create supporter invite or request (depending on admin status)
  static async createSupporterInvite(invite: Omit<SupporterInvite, 'id' | 'created_at' | 'status' | 'invite_token'>): Promise<SupporterInvite> {
    console.group('🔄 Creating Supporter Invite/Request');
    console.log('Invite data:', invite);

    try {
      const currentUser = await supabase.auth.getUser();
      const currentUserId = currentUser.data.user?.id;
      if (!currentUserId) {
        console.error('❌ No authenticated user when creating invite');
        throw new Error('Not authenticated');
      }
      
      // If user is inviting for their own account, always create a pending request
      if (currentUserId === invite.individual_id) {
        console.log('Creating approval request (self-invite)');
        const { data, error } = await supabase
          .from('supporter_invites')
          .insert({
            individual_id: invite.individual_id,
            inviter_id: currentUserId,
            invitee_email: invite.invitee_email,
            invitee_name: invite.invitee_name,
            role: invite.role,
            permission_level: invite.permission_level,
            specific_goals: invite.specific_goals,
            message: invite.message,
            expires_at: invite.expires_at,
            status: 'pending_admin_approval',
            requires_approval: true,
            requested_by: currentUserId,
            invite_token: '' // Will be generated on approval
          })
          .select()
          .single();

        if (error) throw error;
        
        console.log('✅ Self-invite request created:', data);
        console.groupEnd();
        return {
          ...data,
          role: data.role as UserRole,
          permission_level: data.permission_level as PermissionLevel
        } as SupporterInvite;
      }

      // Check if current user is admin of the individual account
      const isUserAdmin = await this.isAdmin(invite.individual_id);
      console.log('Is user admin?', isUserAdmin);

      if (!isUserAdmin) {
        // Non-admin creates a request for approval
        console.log('Creating approval request (non-admin user)');
        const { data, error } = await supabase
          .from('supporter_invites')
          .insert({
            individual_id: invite.individual_id,
            inviter_id: currentUserId,
            invitee_email: invite.invitee_email,
            invitee_name: invite.invitee_name,
            role: invite.role,
            permission_level: invite.permission_level,
            specific_goals: invite.specific_goals,
            message: invite.message,
            expires_at: invite.expires_at,
            status: 'pending_admin_approval',
            requires_approval: true,
            requested_by: currentUserId,
            invite_token: '' // Will be generated on approval
          })
          .select()
          .single();

        if (error) throw error;
        
        console.log('✅ Approval request created:', data);
        console.groupEnd();
        return {
          ...data,
          role: data.role as UserRole,
          permission_level: data.permission_level as PermissionLevel
        } as SupporterInvite;
      }

      // Admin creates direct invitation
      console.log('Creating direct invitation (admin user)');
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
  // Legacy account claim methods removed - using simplified auth flow

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

    // Check if user is admin of themselves (only for self-signup users)
    if (currentUserId === individualId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('created_by_supporter')
        .eq('user_id', individualId)
        .single();
      
      // Self-signup users (created_by_supporter is null) are admin of themselves
      // Supporter-created users are NOT admin of themselves
      return profile?.created_by_supporter === null;
    }

    // Check if user is admin via supporters table
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

  // Get pending approval requests for admin review
  static async getPendingRequests(individualId: string): Promise<SupporterInvite[]> {
    const { data, error } = await supabase
      .from('supporter_invites')
      .select('*')
      .eq('individual_id', individualId)
      .eq('status', 'pending_admin_approval')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(request => ({
      ...request,
      role: request.role as UserRole,
      permission_level: request.permission_level as PermissionLevel
    })) as SupporterInvite[];
  }

  // Approve supporter request (converts to real invitation)
  static async approveSupporterRequest(requestId: string): Promise<SupporterInvite> {
    try {
      // First, get the request details
      const { data: request, error: fetchError } = await supabase
        .from('supporter_invites')
        .select('*')
        .eq('id', requestId)
        .eq('status', 'pending_admin_approval')
        .single();

      if (fetchError || !request) throw new Error('Request not found');

      // Create actual invitation using secure function
      const { data, error } = await supabase.rpc('create_supporter_invite_secure', {
        p_individual_id: request.individual_id,
        p_invitee_email: request.invitee_email,
        p_invitee_name: request.invitee_name,
        p_role: request.role,
        p_permission_level: request.permission_level,
        p_specific_goals: request.specific_goals,
        p_message: request.message,
        p_expires_at: request.expires_at
      });

      if (error) throw error;

      // Delete the approval request
      await supabase
        .from('supporter_invites')
        .delete()
        .eq('id', requestId);

      const inviteRecord = data[0];
      return {
        ...inviteRecord,
        role: inviteRecord.role as UserRole,
        permission_level: inviteRecord.permission_level as PermissionLevel
      } as SupporterInvite;
    } catch (error) {
      console.error('Failed to approve supporter request:', error);
      throw error;
    }
  }

  // Deny supporter request
  static async denySupporterRequest(requestId: string): Promise<void> {
    const { error } = await supabase
      .from('supporter_invites')
      .update({ status: 'declined' })
      .eq('id', requestId);
    
    if (error) throw error;
  }
}