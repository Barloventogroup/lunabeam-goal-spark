import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Settings, 
  Award, 
  Bell, 
  Shield, 
  Download, 
  HelpCircle,
  ChevronRight,
  Trophy,
  Star,
  Coins,
  LogOut,
  Gift,
  Inbox
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useAuth } from '../auth/auth-provider';
import { RewardsScreen } from '../lunebeam/rewards-screen';
import { RewardsGallery, RewardsAdminList, RedemptionInbox } from '../lunebeam/reward-bank';
import { ProfileView } from '../lunebeam/profile-view';

type YouView = 'profile' | 'rewards' | 'settings' | 'profileDetail' | 'rewardBank' | 'rewardAdmin' | 'redemptionInbox';

export const TabYou: React.FC = () => {
  const { profile, badges } = useStore();
  const { signOut } = useAuth();
  const [currentView, setCurrentView] = useState<YouView>('profile');

  const handleLogout = () => {
    signOut();
  };

  if (currentView === 'rewards') {
    return <RewardsScreen onBack={() => setCurrentView('profile')} />;
  }

  if (currentView === 'rewardBank') {
    return <RewardsGallery onBack={() => setCurrentView('profile')} />;
  }

  if (currentView === 'rewardAdmin') {
    return <RewardsAdminList onBack={() => setCurrentView('profile')} />;
  }

  if (currentView === 'redemptionInbox') {
    return <RedemptionInbox onBack={() => setCurrentView('profile')} />;
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

        {/* Tabs for Rewards and Achievements */}
        <Tabs defaultValue="rewards" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="rewards">Rewards</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
          </TabsList>
          
          <TabsContent value="rewards" className="space-y-3 mt-4">
            {/* Rewards & Achievements */}
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setCurrentView('rewards')}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Award className="h-5 w-5 text-purple-500" />
                    <div>
                      <div className="font-medium">Rewards & Achievements</div>
                      <div className="text-sm text-muted-foreground">View your badges and points</div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            {/* Reward Bank */}
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setCurrentView('rewardBank')}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Gift className="h-5 w-5 text-purple-500" />
                    <div>
                      <div className="font-medium">Reward Bank</div>
                      <div className="text-sm text-muted-foreground">Redeem your points</div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            {/* Manage Rewards */}
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setCurrentView('rewardAdmin')} data-reward-admin>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Settings className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="font-medium">Manage Rewards</div>
                      <div className="text-sm text-muted-foreground">Supporter controls</div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            {/* Redemption Inbox */}
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setCurrentView('redemptionInbox')}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Inbox className="h-5 w-5 text-green-500" />
                    <div>
                      <div className="font-medium">Redemption Inbox</div>
                      <div className="text-sm text-muted-foreground">Approve redemptions</div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="achievements" className="mt-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setCurrentView('rewards')}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Trophy className="h-5 w-5 text-gold-500" />
                    <div>
                      <div className="font-medium">View Achievements</div>
                      <div className="text-sm text-muted-foreground">See all your earned badges and milestones</div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Other Options */}
        <div className="space-y-3 mt-6">
          {/* Settings & Privacy */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Settings className="h-5 w-5 text-gray-500" />
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