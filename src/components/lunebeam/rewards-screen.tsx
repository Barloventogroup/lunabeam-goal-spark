import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Trophy, Star, Award, Coins, Crown, CheckCircle, Calendar, Archive } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { PointsDisplay } from './points-display';

interface RewardsScreenProps {
  onBack: () => void;
}

export const RewardsScreen: React.FC<RewardsScreenProps> = ({ onBack }) => {
  const { badges, goals, pointsSummary, loadBadges, loadGoals, loadPoints } = useStore();

  useEffect(() => {
    loadBadges();
    loadGoals();
    loadPoints();
  }, [loadBadges, loadGoals, loadPoints]);

  const completedGoals = goals.filter(goal => goal.status === 'completed');
  const archivedGoals = goals.filter(goal => goal.status === 'archived');
  const allCompletedAndArchived = [...completedGoals, ...archivedGoals];
  const allBadges = badges;
  const totalPoints = pointsSummary?.totalPoints || 0;

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

  const getDomainDisplayName = (domain: string): string => {
    const domainMap: Record<string, string> = {
      'school': 'Education - High School / Academic Readiness',
      'work': 'Employment',
      'health': 'Health & Well-Being',
      'life': 'Life Skills'
    };
    return domainMap[domain] || domain;
  };

  return (
    <div className="min-h-screen bg-gradient-soft">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 bg-card/80 backdrop-blur border-b border-gray-200">
        <BackButton onClick={onBack} />
        <div className="flex-1">
          <h1 className="text-xl font-bold">Rewards</h1>
          <p className="text-sm text-muted-foreground">Your LunaPoints and earned badges</p>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 gap-4">
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
              <div className="text-2xl font-bold">{totalPoints}</div>
              <div className="text-xs text-muted-foreground">LunaPoints</div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Sections */}
        <Tabs defaultValue="points" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="points">LunaPoints</TabsTrigger>
            <TabsTrigger value="badges">Badges Earned</TabsTrigger>
          </TabsList>

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

          {/* LunaPoints Tab */}
          <TabsContent value="points" className="space-y-4">
            <PointsDisplay />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};