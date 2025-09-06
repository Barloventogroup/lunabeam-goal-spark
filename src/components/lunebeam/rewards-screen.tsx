import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Trophy, Star, Award, Coins, Crown, CheckCircle, Calendar, Archive } from 'lucide-react';
import { useStore } from '@/store/useStore';

interface RewardsScreenProps {
  onBack: () => void;
}

export const RewardsScreen: React.FC<RewardsScreenProps> = ({ onBack }) => {
  const { badges, goals, loadBadges, loadGoals } = useStore();

  useEffect(() => {
    loadBadges();
    loadGoals();
  }, [loadBadges, loadGoals]);

  const mockPoints = 247;
  const completedGoals = goals.filter(goal => goal.status === 'completed');
  const archivedGoals = goals.filter(goal => goal.status === 'archived');
  const allCompletedAndArchived = [...completedGoals, ...archivedGoals];
  const allBadges = badges;

  const getBadgeIcon = (type: string) => {
    switch (type) {
      case 'gold': return <Crown className="h-6 w-6 text-yellow-500" />;
      case 'silver': return <Star className="h-6 w-6 text-gray-400" />;
      default: return <Award className="h-6 w-6 text-bronze-500" />;
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'gold': return 'bg-yellow-500/10 border-yellow-200';
      case 'silver': return 'bg-gray-400/10 border-gray-200';
      default: return 'bg-orange-500/10 border-orange-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-soft">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 bg-card/80 backdrop-blur border-b">
        <Button variant="ghost" size="sm" onClick={onBack} className="p-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Rewards & Achievements</h1>
          <p className="text-sm text-muted-foreground">Your accomplishments and progress</p>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="text-center">
            <CardContent className="p-4">
              <Trophy className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
              <div className="text-2xl font-bold">{allCompletedAndArchived.length}</div>
              <div className="text-xs text-muted-foreground">Goals Completed</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <Star className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">{allBadges.length}</div>
              <div className="text-xs text-muted-foreground">Badges Earned</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <Coins className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold">{mockPoints}</div>
              <div className="text-xs text-muted-foreground">Points</div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Sections */}
        <Tabs defaultValue="goals" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="goals">Goals Completed</TabsTrigger>
            <TabsTrigger value="badges">Badges Earned</TabsTrigger>
            <TabsTrigger value="points">Points</TabsTrigger>
          </TabsList>

          {/* Goals Completed Tab */}
          <TabsContent value="goals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Completed & Archived Goals ({allCompletedAndArchived.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {allCompletedAndArchived.length === 0 ? (
                  <div className="text-center py-8">
                    <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-medium mb-2">No completed goals yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Keep working on your goals to see them here!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {allCompletedAndArchived.map((goal) => (
                      <div 
                        key={goal.id} 
                        className="flex items-center gap-4 p-4 border rounded-lg bg-muted/30"
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          goal.status === 'completed' 
                            ? 'bg-green-500/10' 
                            : 'bg-orange-500/10'
                        }`}>
                          {goal.status === 'completed' ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <Archive className="h-5 w-5 text-orange-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{goal.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {goal.description || 'No description'}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {goal.domain || 'General'}
                            </Badge>
                            <Badge 
                              variant={goal.status === 'completed' ? 'default' : 'secondary'} 
                              className="text-xs"
                            >
                              {goal.status === 'completed' ? 'Completed' : 'Archived'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {goal.status === 'completed' ? 'Completed' : 'Archived'} {new Date(goal.updated_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${
                            goal.status === 'completed' ? 'text-green-500' : 'text-orange-500'
                          }`}>
                            {goal.status === 'completed' ? '100%' : `${Math.round(goal.progress_pct)}%`}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {goal.status === 'completed' ? 'Complete' : 'Archived'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Badges Earned Tab */}
          <TabsContent value="badges" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-blue-500" />
                  All Badges ({allBadges.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {allBadges.length === 0 ? (
                  <div className="text-center py-8">
                    <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-medium mb-2">No badges earned yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Complete goals and check-ins to earn your first badge!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {allBadges.map((badge) => (
                      <div 
                        key={badge.id} 
                        className={`p-4 rounded-lg border-2 ${getBadgeColor(badge.type)}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-full bg-white/50 flex items-center justify-center flex-shrink-0">
                            {getBadgeIcon(badge.type)}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium mb-1">{badge.title}</h4>
                            <p className="text-sm text-muted-foreground mb-2">
                              {badge.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className="text-xs">
                                {badge.type.charAt(0).toUpperCase() + badge.type.slice(1)}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(badge.earned_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Points Tab */}
          <TabsContent value="points" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-green-500" />
                  Points Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center mx-auto mb-4">
                    <Coins className="h-10 w-10 text-white" />
                  </div>
                  <div className="text-4xl font-bold mb-2">{mockPoints}</div>
                  <div className="text-muted-foreground mb-6">Total Points Earned</div>
                  
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 rounded-lg bg-muted/30">
                      <div className="text-xl font-bold">{allCompletedAndArchived.length * 50}</div>
                      <div className="text-xs text-muted-foreground">From Goals</div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30">
                      <div className="text-xl font-bold">{allBadges.length * 25}</div>
                      <div className="text-xs text-muted-foreground">From Badges</div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30">
                      <div className="text-xl font-bold">{mockPoints - (allCompletedAndArchived.length * 50) - (allBadges.length * 25)}</div>
                      <div className="text-xs text-muted-foreground">From Activities</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Points History */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Points Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                      <Trophy className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                      <div className="font-medium">Goal Completed</div>
                      <div className="text-sm text-muted-foreground">Reading Challenge</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-green-500">+50</div>
                    <div className="text-xs text-muted-foreground">2 days ago</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <Star className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <div className="font-medium">Badge Earned</div>
                      <div className="text-sm text-muted-foreground">First Steps</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-green-500">+25</div>
                    <div className="text-xs text-muted-foreground">1 week ago</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-purple-500" />
                    </div>
                    <div>
                      <div className="font-medium">Daily Check-in</div>
                      <div className="text-sm text-muted-foreground">7 day streak bonus</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-green-500">+10</div>
                    <div className="text-xs text-muted-foreground">1 week ago</div>
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