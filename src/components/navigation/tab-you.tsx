import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { 
  User, 
  Settings, 
  Award, 
  HelpCircle,
  ChevronRight,
  Trophy,
  LogOut,
  Shield
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useAuth } from '../auth/auth-provider';
import { RewardsScreen } from '../lunebeam/rewards-screen';
import { AchievementsView } from '../lunebeam/achievements-view';
import { RewardsHub } from '../lunebeam/rewards-hub';
import { RewardsGallery, RewardsAdminList, RedemptionInbox } from '../lunebeam/reward-bank';
import { ProfileView } from '../lunebeam/profile-view';

type YouView = 'profile' | 'rewards' | 'achievements' | 'rewardsHub' | 'profileDetail' | 'rewardBank' | 'rewardAdmin' | 'redemptionInbox';

export const TabYou: React.FC = () => {
  const { profile } = useStore();
  const { signOut } = useAuth();
  const [currentView, setCurrentView] = useState<YouView>('profile');

  React.useEffect(() => {
    console.log('TabYou: Rendering with profile:', profile);
  }, [profile]);

  const handleLogout = () => {
    console.log('TabYou: Sign out clicked');
    signOut();
  };

  if (currentView === 'rewards') {
    return <RewardsScreen onBack={() => setCurrentView('profile')} />;
  }

  if (currentView === 'achievements') {
    return <AchievementsView onBack={() => setCurrentView('profile')} />;
  }

  if (currentView === 'rewardsHub') {
    return (
      <RewardsHub 
        onBack={() => setCurrentView('profile')}
        onNavigateToRewards={() => setCurrentView('rewards')}
        onNavigateToRewardBank={() => setCurrentView('rewardBank')}
        onNavigateToManageRewards={() => setCurrentView('rewardAdmin')}
        onNavigateToRedemptionInbox={() => setCurrentView('redemptionInbox')}
      />
    );
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

  return (
    <div className="min-h-screen bg-gradient-soft">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 bg-card/80 backdrop-blur border-b border-gray-200">
        <h1 className="text-xl font-bold">You</h1>
        <p className="text-sm text-muted-foreground">Profile, settings, and achievements</p>
      </div>

      <div className="px-6 pt-4 pb-4">
        {/* Profile Card */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow mb-6" onClick={() => setCurrentView('profileDetail')}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt="Profile picture"
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xl font-normal">
                  {profile?.first_name?.charAt(0) || 'U'}
                </div>
              )}
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
                    <div className="text-sm text-muted-foreground">Manage your rewards and redemptions</div>
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
                    <div className="text-sm text-muted-foreground">View your completed goals and milestones</div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          {/* Settings & Privacy */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="font-medium">Settings & Privacy</div>
                    <div className="text-sm text-muted-foreground">Notifications, privacy, and preferences</div>
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
                    <div className="text-sm text-muted-foreground">FAQ, support, and app information</div>
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
                    <div className="text-sm text-muted-foreground">Sign out of your account</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};