import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Settings, Award, HelpCircle, ChevronRight, Trophy, LogOut, Shield, RotateCcw, Bell } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useAuth } from '../auth/auth-provider';
import { getSupporterContext } from '@/utils/supporterUtils';
import { RewardsScreen } from '../lunebeam/rewards-screen';
import { AchievementsView } from '../lunebeam/achievements-view';
import { RewardsHub } from '../lunebeam/rewards-hub';
import { RewardsGallery, RewardsAdminList, RedemptionInbox } from '../lunebeam/reward-bank';
import { ProfileView } from '../lunebeam/profile-view';
import { NotificationsList } from '../lunebeam/notifications-list';
import { SettingsPrivacyView } from '../lunebeam/settings-privacy-view';
import { notificationsService } from '@/services/notificationsService';
import { supabase } from '@/integrations/supabase/client';
import { NotificationBadge } from '../lunebeam/notification-badge';
type YouView = 'profile' | 'rewards' | 'achievements' | 'rewardsHub' | 'profileDetail' | 'rewardBank' | 'rewardAdmin' | 'redemptionInbox' | 'notifications' | 'settingsPrivacy';
interface TabYouProps {
  initialView?: YouView;
}
export const TabYou: React.FC<TabYouProps> = ({
  initialView = 'profile'
}) => {
  const {
    profile,
    resetOnboarding,
    userContext
  } = useStore();
  const {
    signOut
  } = useAuth();
  const [currentView, setCurrentView] = useState<YouView>(initialView);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    console.log('TabYou: Rendering with profile:', profile);
    
    // Refresh profile once on mount
    useStore.getState().refreshProfile();
    
    loadUnreadCount();
    checkAdminStatus();

    // Subscribe to real-time updates
    const channel = supabase.channel('notification-count-updates').on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications'
    }, () => {
      loadUnreadCount();
    }).on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'notifications'
    }, () => {
      loadUnreadCount();
    }).on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'profiles',
      filter: `user_id=eq.${profile?.user_id}`
    }, () => {
      // Profile updated from another device, refresh
      console.log('TabYou: Profile updated, refreshing');
      useStore.getState().refreshProfile();
    }).subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile, userContext]);
  const checkAdminStatus = async () => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return;
      const supporterContext = await getSupporterContext(user.id);

      // Check if user is admin by looking at supporters table
      const {
        data: supporterData
      } = await supabase.from('supporters').select('is_admin').eq('supporter_id', user.id).single();
      setIsAdmin(supporterData?.is_admin || false);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };
  const loadUnreadCount = async () => {
    try {
      const count = await notificationsService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };
  const handleLogout = () => {
    console.log('TabYou: Sign out clicked');
    signOut();
  };
  const handleResetOnboarding = async () => {
    if (confirm('Reset onboarding to test role selection? This will log you out.')) {
      await resetOnboarding();
      signOut();
    }
  };
  if (currentView === 'rewards') {
    return <RewardsScreen onBack={() => setCurrentView('profile')} />;
  }
  if (currentView === 'achievements') {
    return <AchievementsView onBack={() => setCurrentView('profile')} />;
  }
  if (currentView === 'rewardsHub') {
    return <RewardsHub onBack={() => setCurrentView('profile')} onNavigateToRewards={() => setCurrentView('rewards')} onNavigateToRewardBank={() => setCurrentView('rewardBank')} onNavigateToManageRewards={() => setCurrentView('rewardAdmin')} onNavigateToRedemptionInbox={() => setCurrentView('redemptionInbox')} showAdminFeatures={isAdmin} />;
  }
  if (currentView === 'rewardBank') {
    return <RewardsGallery onBack={() => setCurrentView('rewardsHub')} />;
  }
  if (currentView === 'rewardAdmin') {
    return <RewardsAdminList onBack={() => setCurrentView('rewardsHub')} />;
  }
  if (currentView === 'redemptionInbox') {
    return <RedemptionInbox onBack={() => setCurrentView('rewardsHub')} />;
  }
  if (currentView === 'profileDetail') {
    return <ProfileView onBack={() => setCurrentView('profile')} />;
  }
  if (currentView === 'notifications') {
    return <NotificationsList onBack={() => setCurrentView('profile')} />;
  }
  if (currentView === 'settingsPrivacy') {
    return <SettingsPrivacyView onBack={() => setCurrentView('profile')} />;
  }
  return <div className="min-h-[100dvh] bg-gradient-soft pt-safe-content">
      {/* Header */}
      <div className="fixed left-0 right-0 top-safe z-40 px-4 pb-4 pt-4 bg-card">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">You</h1>
          <NotificationBadge onNavigateToNotifications={() => setCurrentView('notifications')} />
        </div>
      </div>

      <div className="px-6 pt-4 pb-4">
        {/* Profile Card */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow mb-6" onClick={() => setCurrentView('profileDetail')}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              {profile?.avatar_url ? <img src={`${profile.avatar_url}?t=${Date.now()}`} alt="Profile picture" className="w-16 h-16 rounded-full object-cover" /> : <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xl font-normal">
                  {profile?.first_name?.charAt(0) || 'U'}
                </div>}
              <div className="flex-1">
                <h2 className="text-xl font-bold">{profile?.first_name || 'User'}</h2>
                <p className="text-muted-foreground">Lunabeam Member</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Navigation Cards */}
        <div className="space-y-3">
          {/* Rewards */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setCurrentView('rewardsHub')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-purple-500" />
                  <div>
                    <div className="font-medium">Rewards</div>
                    
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setCurrentView('achievements')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <div>
                    <div className="font-medium">Achievements</div>
                    
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setCurrentView('notifications')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      Notifications
                      {unreadCount > 0 && <Badge variant="secondary" className="text-xs px-2 py-0">
                          {unreadCount}
                        </Badge>}
                    </div>
                    
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          {/* Test: Reset Onboarding */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow border-orange-200" onClick={handleResetOnboarding}>
            
          </Card>

          {/* Settings & Privacy */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setCurrentView('settingsPrivacy')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="font-medium">Settings & Privacy</div>
                    
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          {/* Help & Support */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <HelpCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="font-medium">Help & Support</div>
                    
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          {/* Sign Out */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleLogout}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <LogOut className="h-5 w-5 text-red-500" />
                  <div>
                    <div className="font-medium text-red-600">Sign Out</div>
                    
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>;
};