import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Bell, CheckCircle, Clock, Users, Target, Award, ChevronLeft, ChevronRight } from 'lucide-react';
import { notificationsService, Notification } from '@/services/notificationsService';
import { PermissionsService } from '@/services/permissionsService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface NotificationsListProps {
  onBack: () => void;
}

export const NotificationsList: React.FC<NotificationsListProps> = ({ onBack }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const { toast } = useToast();

  const notificationsPerPage = 10;

  useEffect(() => {
    loadNotifications();
    
    // Subscribe to real-time notification updates
    const channel = supabase
      .channel('notifications-updates')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications'
       }, () => {
        // Reset to first page when new notifications arrive
        setCurrentPage(1);
        loadNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentPage]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const result = await notificationsService.getNotifications(currentPage, notificationsPerPage);
      console.log('Notifications loaded:', {
        currentPage,
        total: result.total,
        notificationsCount: result.notifications.length,
        hasMore: result.hasMore
      });
      setNotifications(result.notifications);
      setTotal(result.total);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationsService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, read_at: new Date().toISOString() }
            : n
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleApprovalAction = async (notificationId: string, action: 'approve' | 'deny', requestData: any) => {
    try {
      if (action === 'approve') {
        await PermissionsService.approveRequest(requestData.individual_id, requestData.invitee_email);
        toast({
          title: "Request Approved",
          description: "The supporter invitation has been sent",
        });
      } else {
        await PermissionsService.denyRequest(requestData.individual_id, requestData.invitee_email);
        toast({
          title: "Request Denied",
          description: "The supporter request has been declined",
        });
      }
      
      // Mark notification as read and remove from list
      await handleMarkAsRead(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error: any) {
      console.error('Error handling approval action:', error);
      
      // If the request was already handled, still mark notification as read
      if (error?.message?.includes('already handled or no longer exists')) {
        await handleMarkAsRead(notificationId);
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        toast({
          title: "Request already processed",
          description: "This request has already been handled",
        });
      } else {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to process the request",
          variant: "destructive"
        });
      }
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= Math.ceil(total / notificationsPerPage)) {
      setCurrentPage(newPage);
    }
  };

  const renderPagination = () => {
    const totalPages = Math.ceil(total / notificationsPerPage);
    console.log('Pagination check:', { total, totalPages, notificationsPerPage });
    
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between px-6 py-3 bg-card/80 backdrop-blur border-b border-gray-200">
        <div className="text-sm text-muted-foreground">
          Showing {(currentPage - 1) * notificationsPerPage + 1} to{' '}
          {Math.min(currentPage * notificationsPerPage, total)} of {total} notifications
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNumber;
              if (totalPages <= 5) {
                pageNumber = i + 1;
              } else if (currentPage <= 3) {
                pageNumber = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNumber = totalPages - 4 + i;
              } else {
                pageNumber = currentPage - 2 + i;
              }
              
              return (
                <Button
                  key={pageNumber}
                  variant={currentPage === pageNumber ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(pageNumber)}
                  className="w-8 h-8 p-0"
                >
                  {pageNumber}
                </Button>
              );
            })}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!hasMore}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'approval_request':
        return <Users className="h-5 w-5 text-blue-500" />;
      case 'check_in':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'step_complete':
        return <Target className="h-5 w-5 text-purple-500" />;
      case 'invite_accepted':
        return <Award className="h-5 w-5 text-yellow-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const renderNotificationActions = (notification: Notification) => {
    if (notification.type === 'approval_request' && !notification.read_at) {
      return (
        <div className="flex gap-2 mt-3">
          <Button
            size="sm"
            onClick={() => handleApprovalAction(notification.id, 'approve', notification.data)}
            className="bg-green-600 hover:bg-green-700"
          >
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleApprovalAction(notification.id, 'deny', notification.data)}
          >
            Deny
          </Button>
        </div>
      );
    }
    
    if (!notification.read_at) {
      return (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleMarkAsRead(notification.id)}
          className="mt-2 text-xs"
        >
          Mark as read
        </Button>
      );
    }
    
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-soft">
        <div className="px-6 pt-6 pb-4 bg-card/80 backdrop-blur border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-bold">Notifications</h1>
          </div>
        </div>
        <div className="px-6 pt-6">
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-100 rounded w-3/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.read_at).length;

  return (
    <div className="min-h-screen bg-gradient-soft">
      {/* Header */}
      <div className="sticky top-0 z-10">
        <div className="px-6 pt-6 pb-4 bg-card/80 backdrop-blur border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-bold">Notifications</h1>
            {unreadCount > 0 && (
              <Badge variant="secondary">{unreadCount} unread</Badge>
            )}
          </div>
        </div>
        
        {/* Pagination Subheader */}
        {renderPagination()}
      </div>

      <div className="px-6 pt-6 pb-6">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
              <p className="text-gray-500">You're all caught up! Notifications will appear here.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={`transition-all duration-200 ${
                  !notification.read_at 
                    ? 'border-blue-200 bg-blue-50/50 shadow-sm' 
                    : 'hover:shadow-sm'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{notification.title}</h4>
                        {!notification.read_at && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      {renderNotificationActions(notification)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
           </div>
        )}
        
      </div>
    </div>
  );
};