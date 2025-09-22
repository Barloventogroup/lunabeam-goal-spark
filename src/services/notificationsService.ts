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