import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { notificationsService } from '@/services/notificationsService';
import { supabase } from '@/integrations/supabase/client';
interface NotificationBadgeProps {
  onNavigateToNotifications: () => void;
  className?: string;
}
export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  onNavigateToNotifications,
  className = ""
}) => {
  const [unreadCount, setUnreadCount] = useState(0);

  // Load initial unread count
  const loadUnreadCount = async () => {
    try {
      const count = await notificationsService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread notifications count:', error);
    }
  };
  useEffect(() => {
    loadUnreadCount();

    // Set up real-time subscription for notifications
    const channel = supabase.channel('notification-updates').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'notifications'
    }, () => {
      // Reload unread count when notifications change
      loadUnreadCount();
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  return <div className={`relative ${className}`}>
      
    </div>;
};