import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Inbox,
  CheckCircle, 
  Calendar, 
  Archive, 
  MoreHorizontal,
  ArchiveX
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useAuth } from '../auth/auth-provider';
import { RewardsScreen } from '../lunebeam/rewards-screen';
import { AchievementsView } from '../lunebeam/achievements-view';
import { RewardsGallery, RewardsAdminList, RedemptionInbox } from '../lunebeam/reward-bank';
import { ProfileView } from '../lunebeam/profile-view';
import { goalsService } from '@/services/goalsService';
import { toast } from '@/hooks/use-toast';
type YouView = 'profile' | 'rewards' | 'achievements' | 'settings' | 'profileDetail' | 'rewardBank' | 'rewardAdmin' | 'redemptionInbox';

export const TabYou: React.FC = () => {
  const { profile, badges, goals, loadGoals } = useStore();
  const { signOut } = useAuth();
  const [currentView, setCurrentView] = useState<YouView>('profile');
  const [isArchiving, setIsArchiving] = useState<string | null>(null);

  const handleLogout = () => {
    signOut();
  };

  const completedGoals = goals.filter(goal => goal.status === 'completed');
  const archivedGoals = goals.filter(goal => goal.status === 'archived');

  const getDomainDisplayName = (domain: string): string => {
    const domainMap: Record<string, string> = {
      'school': 'Education - High School / Academic Readiness',
      'work': 'Employment',
      'health': 'Health & Well-Being',
      'life': 'Life Skills'
    };
    return domainMap[domain] || domain;
  };

  const handleArchiveGoal = async (goalId: string) => {
    setIsArchiving(goalId);
    try {
      await goalsService.updateGoal(goalId, { status: 'archived' });
      await loadGoals();
      toast({
        title: "Goal Archived",
        description: "The goal has been successfully archived.",
      });
    } catch (error) {
      console.error('Error archiving goal:', error);
      toast({
        title: "Error",
        description: "Failed to archive the goal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsArchiving(null);
    }
  };

  const handleUnarchiveGoal = async (goalId: string) => {
    setIsArchiving(goalId);
    try {
      await goalsService.updateGoal(goalId, { status: 'completed' });
      await loadGoals();
      toast({
        title: "Goal Unarchived",
        description: "The goal has been moved back to completed goals.",
      });
    } catch (error) {
      console.error('Error unarchiving goal:', error);
      toast({
        title: "Error",
        description: "Failed to unarchive the goal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsArchiving(null);
    }
  };

  const formatCompletionDate = (goal: any) => {
    const date = new Date(goal.updated_at);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
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

        {/* Tabs for Rewards, Achievements, and More */}
        <Tabs defaultValue="rewards" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="rewards">Rewards</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="more">Account</TabsTrigger>
          </TabsList>
          
          <TabsContent value="rewards" className="space-y-3 mt-4">
            {/* Rewards */}
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setCurrentView('rewards')}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Award className="h-5 w-5 text-purple-500" />
                    <div>
                      <div className="font-medium">Rewards</div>
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
          
          <TabsContent value="achievements" className="space-y-6 mt-4">
            {/* Overview Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="text-center">
                <CardContent className="p-4">
                  <Trophy className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
                  <div className="text-2xl font-bold">{completedGoals.length}</div>
                  <div className="text-xs text-muted-foreground">Completed Goals</div>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="p-4">
                  <Archive className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                  <div className="text-2xl font-bold">{archivedGoals.length}</div>
                  <div className="text-xs text-muted-foreground">Archived Goals</div>
                </CardContent>
              </Card>
            </div>

            {/* Completed Goals Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Completed Goals ({completedGoals.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {completedGoals.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-medium mb-2">No completed goals yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Complete your first goal to start building your achievements!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {completedGoals.map((goal) => (
                      <div 
                        key={goal.id} 
                        className="flex items-center gap-4 p-4 border rounded-lg bg-green-500/5 hover:bg-green-500/10 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{goal.title}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {goal.description || 'No description'}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {getDomainDisplayName(goal.domain || 'General')}
                            </Badge>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>Completed {formatCompletionDate(goal)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-500">100%</div>
                            <div className="text-xs text-muted-foreground">Complete</div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0"
                                disabled={isArchiving === goal.id}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleArchiveGoal(goal.id)}>
                                <Archive className="h-4 w-4 mr-2" />
                                Archive Goal
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Archived Goals Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Archive className="h-5 w-5 text-orange-500" />
                  Archived Goals ({archivedGoals.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {archivedGoals.length === 0 ? (
                  <div className="text-center py-8">
                    <Archive className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-medium mb-2">No archived goals</h3>
                    <p className="text-sm text-muted-foreground">
                      Goals you archive will appear here for future reference.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {archivedGoals.map((goal) => (
                      <div 
                        key={goal.id} 
                        className="flex items-center gap-4 p-4 border rounded-lg bg-orange-500/5 hover:bg-orange-500/10 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                          <Archive className="h-5 w-5 text-orange-500" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{goal.title}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {goal.description || 'No description'}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {getDomainDisplayName(goal.domain || 'General')}
                            </Badge>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>Archived {formatCompletionDate(goal)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className="text-lg font-bold text-orange-500">
                              {Math.round(goal.progress_pct)}%
                            </div>
                            <div className="text-xs text-muted-foreground">Archived</div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0"
                                disabled={isArchiving === goal.id}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleUnarchiveGoal(goal.id)}>
                                <ArchiveX className="h-4 w-4 mr-2" />
                                Unarchive Goal
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="more" className="space-y-3 mt-4">
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};