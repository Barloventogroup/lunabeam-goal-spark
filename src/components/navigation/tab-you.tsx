import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  LogOut
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useAuth } from '../auth/auth-provider';
import { RewardsScreen } from '../lunebeam/rewards-screen';

type YouView = 'profile' | 'rewards' | 'settings';

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

  return (
    <div className="min-h-screen bg-gradient-soft">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 bg-card/80 backdrop-blur border-b">
        <h1 className="text-xl font-bold">You</h1>
        <p className="text-sm text-muted-foreground">Profile, settings, and achievements</p>
      </div>

      <div className="px-6 pt-6 pb-4 space-y-6">
        {/* Profile Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xl font-bold">
                {profile?.first_name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold">{profile?.first_name || 'User'}</h2>
                <p className="text-muted-foreground">Lunabeam Member</p>
                
                {/* Strengths & Interests */}
                {(profile?.strengths || profile?.interests) && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {profile?.strengths?.slice(0, 2).map(strength => (
                      <Badge key={strength} variant="secondary" className="text-xs">
                        {strength}
                      </Badge>
                    ))}
                    {profile?.interests?.slice(0, 2).map(interest => (
                      <Badge key={interest} variant="outline" className="text-xs">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="text-center">
            <CardContent className="p-4">
              <Trophy className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
              <div className="text-2xl font-bold">3</div>
              <div className="text-xs text-muted-foreground">Goals Completed</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <Star className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">{badges.length}</div>
              <div className="text-xs text-muted-foreground">Badges Earned</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <Coins className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold">247</div>
              <div className="text-xs text-muted-foreground">Points</div>
            </CardContent>
          </Card>
        </div>

        {/* Menu Options */}
        <div className="space-y-4">
          {/* Rewards */}
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

          {/* Settings */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Settings className="h-5 w-5 text-gray-500" />
                  <div>
                    <div className="font-medium">Settings</div>
                    <div className="text-sm text-muted-foreground">Notifications, privacy, and preferences</div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Data */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="font-medium">Privacy & Data</div>
                    <div className="text-sm text-muted-foreground">Consent, sharing, and data export</div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          {/* Help & About */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <HelpCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="font-medium">Help & About</div>
                    <div className="text-sm text-muted-foreground">FAQ, support, and app information</div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          {/* Logout */}
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