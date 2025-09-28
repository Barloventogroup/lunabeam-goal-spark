import { supabase } from '@/integrations/supabase/client';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  read_at?: string;
  created_at: string;
}

export const notificationsService = {
  // Get notifications for current user
  async getNotifications(limit = 50): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  // Create in-app notification
  async createNotification(notification: {
    user_id: string;
    type: string;
    title: string;
    message: string;
    data?: any;
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert(notification);
      if (error) {
        console.error('Error creating notification:', error);
      }
    } catch (err) {
      console.error('Failed to create notification:', err);
    }
  },

  // Create approval request notification
  async createApprovalRequestNotification(adminId: string, requestData: {
    individual_id: string;
    invitee_email: string;
    invitee_name?: string;
    requester_name: string;
  }): Promise<void> {
    await this.createNotification({
      user_id: adminId,
      type: 'approval_request',
      title: 'New Supporter Request',
      message: `${requestData.requester_name} wants to invite ${requestData.invitee_name || requestData.invitee_email} as a supporter`,
      data: requestData
    });
  },

  // Create check-in notification
  async createCheckInNotification(supporterId: string, checkInData: {
    individual_name: string;
    goal_title?: string;
  }): Promise<void> {
    await this.createNotification({
      user_id: supporterId,
      type: 'check_in',
      title: 'Check-in Completed',
      message: `${checkInData.individual_name} completed a check-in${checkInData.goal_title ? ` for "${checkInData.goal_title}"` : ''}`,
      data: checkInData
    });
  },

  // Create step completion notification
  async createStepCompletionNotification(supporterId: string, stepData: {
    individual_name: string;
    step_title: string;
    goal_title: string;
  }): Promise<void> {
    await this.createNotification({
      user_id: supporterId,
      type: 'step_complete',
      title: 'Step Completed! 🎉',
      message: `${stepData.individual_name} completed "${stepData.step_title}" in goal "${stepData.goal_title}"`,
      data: stepData
    });
  },

  // Create supporter invite accepted notification
  async createInviteAcceptedNotification(inviterId: string, acceptData: {
    supporter_name: string;
    individual_name: string;
  }): Promise<void> {
    await this.createNotification({
      user_id: inviterId,
      type: 'invite_accepted',
      title: 'Supporter Joined!',
      message: `${acceptData.supporter_name} accepted the invitation to support ${acceptData.individual_name}`,
      data: acceptData
    });
  },

  // Get unread notifications count
  async getUnreadCount(): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .is('read_at', null);

    if (error) throw error;
    return count || 0;
  },

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) throw error;
  },

  // Mark all notifications as read
  async markAllAsRead(): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .is('read_at', null);

    if (error) throw error;
  },

  // Delete notification
  async deleteNotification(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
  },

  // Email notification functionality
  async sendNotificationEmail(request: {
    type: 'check_in' | 'step_complete' | 'goal_created' | 'goal_assigned';
    userId: string;
    goalId?: string;
    stepId?: string;
    substepId?: string;
    supporterIds?: string[];
  }): Promise<void> {
    try {
      const { data, error } = await supabase.functions.invoke('send-notification-email', {
        body: request,
      });

      if (error) {
        console.error('Error sending notification email:', error);
        throw error;
      }

      console.log('Notification email sent successfully:', data);
    } catch (error) {
      console.error('Failed to send notification email:', error);
      // Don't throw the error to prevent blocking the main functionality
    }
  },

  // Helper methods for specific notification types
  async notifyCheckIn(userId: string, goalId?: string, stepId?: string, substepId?: string): Promise<void> {
    await this.sendNotificationEmail({
      type: 'check_in',
      userId,
      goalId,
      stepId,
      substepId,
    });
  },

  async notifyStepComplete(userId: string, goalId?: string, stepId?: string, substepId?: string): Promise<void> {
    await this.sendNotificationEmail({
      type: 'step_complete',
      userId,
      goalId,
      stepId,
      substepId,
    });
  },

  async notifyGoalCreated(userId: string, goalId: string, supporterIds?: string[]): Promise<void> {
    await this.sendNotificationEmail({
      type: 'goal_created',
      userId,
      goalId,
      supporterIds,
    });
  },

  async notifyGoalAssigned(userId: string, goalId: string, supporterIds?: string[]): Promise<void> {
    await this.sendNotificationEmail({
      type: 'goal_assigned',
      userId,
      goalId,
      supporterIds,
    });
  },
};